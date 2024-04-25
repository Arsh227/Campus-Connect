const dotenv = require("dotenv");
const http = require("http");
const mongoose = require("mongoose");
const app = require("./app"); // <--- Here we are importing the app from the app folder (index.js) file
const config = require("./config");
const socket = require('socket.io')
const bodyParser = require('body-parser');

dotenv.config();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const server = http.createServer(app);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("mongodb connected");
    server.listen(process.env.PORT || 4000, () => {
      console.log(`Server running on port: 4000`);
    });
  })
  .catch((error) => {
    console.log(error);
    process.exit(0);
  });


io = socket(server)



io.on('connection', (socket) => {
  console.log("connection established")

  // Notification
  socket.on('joinNotification', ({ room }) => {
    socket.join(room);
  })

  socket.on('sendNotification', ({ room, notifications }) => {
    console.log(room, notifications)
    io.to(room).emit('notification', { notifications });
  })


  socket.on('joinRoomGroup', ({ joiner, room }) => {
    console.log(joiner, 'joined', room)
    socket.join(room);
  });

  socket.on('joinRoom', ({ joiner, room }) => {
    console.log(joiner, 'joined', room)
    socket.join(room);
  });

  socket.on('sendMessage', ({ _id, sender, content, currentRoom }) => {
    io.to(currentRoom).emit('message', { _id, sender, content, currentRoom });
  });

  socket.on('sendMessageGroup', ({ _id, sender, content, currentRoom }) => {
    io.to(currentRoom).emit('messageGroup', { _id, sender, content, currentRoom });
  });

  socket.on('sendMessageMedia', ({ _id, sender, content, currentRoom, media_url }) => {
    console.log(_id, sender, content, currentRoom, media_url)
    io.to(currentRoom).emit('messageMedia', { _id, sender, content, currentRoom, media_url });
  });

  socket.on('sendMessageGroupMedia', ({ _id, sender, content, currentRoom, media_url }) => {
    io.to(currentRoom).emit('messageGroupMedia', { _id, sender, content, currentRoom, media_url });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected')
  })

});


