import os

from time import localtime, strftime
from flask import Flask, render_template, redirect, session, request, url_for, jsonify
from flask_socketio import SocketIO, send, emit, join_room, leave_room


app = Flask(__name__)
app.config['SECRET_KEY'] = 'vnkdjnfjknfl1232#'
socketio = SocketIO(app)

# Keep track of the users, channels and the messages in each channel
channels = ["Lobby"]
users = {}
room_msgs = {}

# Flask-SocketIO Session IDs and Private Messages, PrettyPrinted
@socketio.on("username")
def receive_username(username):

	# Pair usernames with session IDs
	users[username] = request.sid

@app.route("/", methods=['GET', 'POST'])
def index():
	
	return render_template("index.html", channels=channels, users=users)

# Execute when the user tries to create a channel
@socketio.on('roomake')
def roomake(data):

	username = data['username']
	room = data['room']

	if room in channels:
		emit("room_error", "This name is already taken!")
	elif " " in room:
		emit("room_error", "Channel name can't contain any spaces. Try again :)")
	# Success
	else:
		# Add channel to the list of channels
		channels.append(room)
		room_msgs[room] = []

		join_room(room)
		emit("roomake", broadcast=True)

@socketio.on('message')
def message(data):
	
	# Set timestamp
	time_stamp = strftime('%b-%d %I:%M%p', localtime())
	msgs = data["msgs"]
	username = data["username"]
	room = data["room"]

	mydata = {"username": username, "msgs": msgs, "time_stamp": time_stamp, "room": room}

	if room in room_msgs:
		room_msgs[room].append(mydata)
	else:
		room_msgs[room] = []
		room_msgs[room].append(mydata)

	# print("Message passed on!")
	# print(request.sid)
	# print(mydata)

	# Store the 100 most recent messages per channel in server-side memory
	if (len(room_msgs[room]) > 100):
		room_msgs[room].pop(0)

	send(mydata, room=room)

# Execute when the user joins a channel
@socketio.on('join')
def join(data):
	# add user to the channel
	username = data['username']
	room = data['room']
	join_room(room)

	data = {"messages": room_msgs[room]}
	emit("join_channel", data, room=room)

# Execute when the user leaves a channel
@socketio.on('leave')
def leave(data):

	username = data['username']
	room = data['room']
	leave_room(room)
	send({"msg": username + " has left the room "}, room=room)

# Private
@socketio.on('private_message', namespace='/private')
def private_message(payload):
	recipient_session_id = users[payload['username']]
	message = payload['message']

	emit("new_private_message", message, room=recipient_session_id)


if __name__ == '__main__':
	socketio.run(app, debug=True)

