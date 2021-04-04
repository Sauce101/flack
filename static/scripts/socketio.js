document.addEventListener('DOMContentLoaded', () => {
	var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

	// Get user localStorage
    var my_storage = window.localStorage;

	socket.on('connect', () => {
		// If user was in room
        if (my_storage.getItem('room')) {
        
            joinRoom(my_storage.getItem('room'));
        }

		if(!my_storage.getItem('username')) {
			$("#sidebar").hide();
			$("#app_chat").hide();
			document.querySelector("#start_button").disabled = false;
		}
		else {
			$("#user_form").hide();
			$("#sidebar").show();
			$("#app_chat").show();

            document.getElementById("uu").innerHTML = my_storage.getItem('username');
            socket.emit("username", my_storage.getItem("username"));
        }
	});

	// Send message to server
    document.querySelector('#send_message').onclick = () => {
    	// Send a JSON to the server 
    	msgs = document.querySelector('#user_message').value;
    	username = my_storage.getItem('username');
    	const room = my_storage.getItem('room');
    	rr = document.querySelector('#rr').value;

    	if (msgs != "") {
	    	socket.send({'msgs': msgs, 'username': username, 'room': room});

			// Clear input area
	        $("#user_message").val('');
    	}
	}

	// Receive message from server and appened to other messages
	socket.on('message', data => {
		if (data.time_stamp) {
	        const par = document.createElement('p');
	        const span_username = document.createElement('strong');
	        const span_timestamp = document.createElement('small');
	        const br = document.createElement('br');
	    	span_username.innerHTML = data.username;
	    	span_timestamp.innerHTML = data.time_stamp;
	    	par.innerHTML = span_username.outerHTML + "<strong>:</strong>" + br.outerHTML + data.msgs + br.outerHTML + "<small>(</small>" + span_timestamp.outerHTML + "<small>)</small>";

	    	$("#messages-view").append(par);
    	}
    	else {
    		printSysMsg(data.msg);
    	}
	});

	// Reload after channel creation
    socket.on('roomake', data => {
        window.location.reload(true);
    });

    // Execute when an element of the channel list is clicked
    $(document).on("click", "p.select_room", function() {
    	let newRoom = $(this).text();
        // Check if user already in the room
        if (newRoom === my_storage.getItem('room')) {
            msg = `You are already in this room.`;
            printSysMsg(msg);
		} else {
		    leaveRoom(my_storage.getItem('room'));
		    joinRoom(newRoom);
		}
		$("#cc").show();
		$("#input_area").show();
		$("#div_toggle").show();
	});

	// Leave room
	function leaveRoom(room) {
		my_storage.removeItem("room");
		socket.emit('leave', {'username': my_storage.getItem('username'), 'room': room});
	}

	// Join room
	function joinRoom(room) {
		my_storage.setItem('room', room);
		document.querySelector('#rr').innerHTML = room;
		socket.emit('join', {'username': my_storage.getItem('username'), 'room': room});
		// Clear message area
		document.querySelector('#messages-view').innerHTML = '';
	}

	// Print system message
	function printSysMsg(msg) {
		const p = document.createElement('p');
		p.innerHTML = msg;
		$("#messages-view").append(p);
		// Autofocus on text box
        document.querySelector("#user_message").focus();
	}

	// Execute to create a room
    document.querySelector('#make_room').onclick = () => {
        // Emit the channel creation event using the input from the user
        const room = document.querySelector("#user_room").value;
        socket.emit('roomake', {'username': my_storage.getItem('username'), 'room': room});
        // return false;
        $("#user_room").val('');
    }

    // Execute when there was an error while creating a room
    socket.on('room_error', msg => {
        // Show the error
        alert(msg);
    });

    // Start user form
    document.querySelector("#user_form").onsubmit =  () => {
        // Save the username in the local storage
        my_storage.setItem('username', document.querySelector("#name").value);

        $("#user_form").hide();
        // $("#private_div").hide();
        $("#div_toggle").hide();
        $("#cc").hide();
        $("#input_area").hide();
        document.getElementById("uu").innerHTML = my_storage.getItem('username');
        $("#sidebar").show();
        $("#app_chat").show();

        document.querySelector("#name").value = "";
        socket.emit("username", my_storage.getItem('username'));
     	let room = ""
    	joinRoom(room);
        msg = `Welcome to Flack, please select a channel to begin.`;
        printSysMsg(msg);
        return false;
    };

    // Join channel with 100 most recent messages per channel 
    socket.on('join_channel', data => {
        // Clear the messages-view area
        document.querySelector("#messages-view").innerHTML = "";

        // Fill channel history with 100 most recent messages from server-side memory
        var x;
        for (x in data["messages"]) {
            const par = document.createElement('p');
	        const span_username = document.createElement('strong');
	        const span_timestamp = document.createElement('small');
	        const br = document.createElement('br');
        	span_username.innerHTML = data["messages"][x].username;
        	span_timestamp.innerHTML = data["messages"][x].time_stamp;
        	par.innerHTML = span_username.outerHTML + "<strong>:</strong>" + br.outerHTML + data["messages"][x].msgs + br.outerHTML + "<small>(</small" + span_timestamp.outerHTML + "<small>)</small>";

        	$("#messages-view").append(par);
        }
    });

    // Private message alert
    var private_socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + '/private');

    $('#send_private_message').on('click', function() {
    	var recipient = $('#send_to_username').val();
    	var  message_to_send = $('#private_message').val();

    	private_socket.emit('private_message', {'username': recipient, 'message': message_to_send});
    	$("#private_message").val('');

    	return false;
    });

    private_socket.on('new_private_message', function(msg) {
    	alert(msg);
    });

});
