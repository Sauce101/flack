document.addEventListener('DOMContentLoaded', () => {
    // Make 'enter' key submit message
    let msg = document.querySelector('#user_message');
    msg.addEventListener('keyup', event => {
        event.preventDefault();
        if (event.keyCode === 13) {
            document.querySelector('#send_message').click();
        }
    });

    $('form').keypress(function(event) { 
	    return event.keyCode != 13;
	});
});
