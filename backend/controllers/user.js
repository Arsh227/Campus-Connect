// Controllers are functions that run for each route (the function named profile will get the profile info for a user)
const Auth = require("../models/Auth");
const Liked = require("../models/Liked")
const Save = require("../models/Saved")
const Post = require("../models/Post")
const Request = require("../models/Request")
const Group = require("../models/Group")
const ChatRoom = require("../models/ChatRoom")
const Announcement = require("../models/Announcement")
const Event = require('../models/Events'); // Import the Event model


const profile = async (req, res, next) => {
  try {
    const user = req.user;

    const data = await Auth.findOne({ userName: user.userName }).select(
      'name email userName profile_photo createdAt'
    );

    const year = new Date(data.createdAt).getFullYear();

    data.createdAt = year;

    return res.json(data);
  } catch (error) {
    next(error);
  }
};

const GetUserInfoByUsername = async (req, res, next) => {
  const username = req.params.username;
  try {
    const user = await Auth.findOne({ userName: username })

    const userId = user._id
    const userPosts = await Post.find({ post_user_id: userId });

    let likeCount = 0;
    for (const post of userPosts) {
      for (const like of post.likes) {
        if (like !== userId) {
          likeCount++;
        }
      }
    }

    const savedCount = await Save.countDocuments({ post_user_id: userId });
    const postCount = userPosts.length;

    const allFilesAndFolders = userPosts.reduce((acc, post) => acc.concat(post.post_files_n_folders), []);

    return res.status(200).json({
      success: true,
      likeCount,
      savedCount,
      postCount,
      info: {
        name: user.name,
        userName: user.userName,
        profile_photo: user.profile_photo
      },
      post_files_n_folders: allFilesAndFolders
    });
  } catch (error) {
    next(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const GetUserInfo = async (req, res, next) => {
  const userId = req.params.id;

  try {
    const userPosts = await Post.find({ post_user_id: userId });

    let likeCount = 0;
    for (const post of userPosts) {
      for (const like of post.likes) {
        if (like !== userId) {
          likeCount++;
        }
      }
    }

    const savedCount = await Save.countDocuments({ post_user_id: userId });
    const postCount = userPosts.length;

    const allFilesAndFolders = userPosts.reduce((acc, post) => acc.concat(post.post_files_n_folders), []);

    return res.status(200).json({
      success: true,
      likeCount,
      savedCount,
      postCount,
      post_files_n_folders: allFilesAndFolders
    });
  } catch (error) {
    next(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



const GetUserInfoUsername = async (req, res, next) => {
  const username = req.params.username;
  try {
    const data = await Auth.findOne({ userName: username }).select('private name _id profile_photo');
    const requests = await Request.find({
      $or: [
        { from: req.user.userId, to: data._id },
        { from: data._id, to: req.user.userId }
      ]
    }).select('status');


    let currentStatus = 'start';
    if (requests.length > 0) {
      for (const request of requests) {
        if (request.status === 'pending' || request.status === 'accepted') {
          currentStatus = request.status;
          break;
        }
      }
    }
    if (currentStatus === 'pending' || currentStatus == 'start') {
      return res.status(200).json({
        username,
        name: data.name,
        success: false,
        message: 'Account is private',
        private: data.private,
        requestStatus: currentStatus,
        profile_photo: data.profile_photo,
        id: data._id
      });
    } else {
      const user = await Auth.findOne({ userName: username })
      const userId = user._id
      const userPosts = await Post.find({ post_user_id: userId });

      let likeCount = 0;
      for (const post of userPosts) {
        for (const like of post.likes) {
          if (like !== userId) {
            likeCount++;
          }
        }
      }

      const savedCount = await Save.countDocuments({ post_user_id: userId });
      const postCount = userPosts.length;

      const allFilesAndFolders = userPosts.reduce((acc, post) => acc.concat(post.post_files_n_folders), []);

      return res.status(200).json({
        success: true,
        likeCount,
        savedCount,
        postCount,
        info: {
          name: user.name,
          userName: user.userName,
          profile_photo: user.profile_photo
        },
        post_files_n_folders: allFilesAndFolders
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




const SearchUserByKeyword = async (req, res, next) => {

  const keyword = req.params.keyword;
  try {
    const users = await Auth.find({
      userName: { $regex: keyword, $options: 'i' },
      _id: { $ne: req.user.userId }
    });


    return res.json({ users });
  } catch (error) {
    next(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const SendFriendRequest = async (req, res, next) => {
  const { from, to } = req.body;

  try {
    let ifExist = await Request.findOne({ from, to });
    if (ifExist) {
      if (ifExist.status === "start") {
        ifExist.status = "pending";
        await ifExist.save();
      }
      return res.status(200).json({
        success: false,
        message: "Friend request is already sent",
        requestStatus: ifExist.status,
      });
    }

    let oppositeRequest = await Request.findOne({ from: to, to: from });
    if (oppositeRequest) {
      return res.status(200).json({
        success: false,
        message: "Friend request is already received",
        requestStatus: oppositeRequest.status,
      });
    }

    const newRequest = await Request.create({ from, to, status: "pending" });
    if (newRequest) {
      return res.status(200).json({
        success: true,
        message: "Friend request sent!",
        requestStatus: newRequest.status
      });
    }
    return res.status(400).json({ success: false, message: "Something went wrong" });
  } catch (error) {
    next(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


const GetFriendRequests = async (req, res, next) => {
  try {
    const requests = await Request.find({ to: req.user.userId, status: 'pending' })

    if (requests.length > 0) {
      const populatedRequests = await Promise.all(requests.map(async request => {
        const userId = request.from;
        const userDetails = await Auth.findById(userId);

        const userInfo = {
          userId: userDetails._id,
          userName: userDetails.userName,
        };

        return {
          ...request.toObject(),
          from: userInfo
        };
      }));

      return res.status(200).json({
        success: true,
        requests: populatedRequests
      });
    }
  } catch (error) {
    next(error)
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const AcceptFriendRequest = async (req, res, next) => {
  const { ofUser } = req.body;

  try {
    const generateRoomCode = () => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let roomCode = '';
      for (let i = 0; i < 8; i++) {
        roomCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return roomCode;
    };

    const room = generateRoomCode();

    const updatedRequest = await Request.findOneAndUpdate(
      { from: ofUser, to: req?.user?.userId, status: "pending" },
      { status: "accepted", roomCode: room },
      { new: true }
    );

    if (updatedRequest) {
      // Check if the chat room already exists
      let chatRoom = await ChatRoom.findOne({ roomCode: room });

      // If the chat room doesn't exist, create a new one
      if (!chatRoom) {
        chatRoom = await ChatRoom.create({
          roomCode: room,
          participants: [ofUser, req.user.userId],
          messages: []
        });
      }

      return res.status(200).json({ status: true, message: 'Accepted friend request' });
    }

  } catch (error) {
    console.error("Error accepting friend request:", error);
    next(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const GetUsersAccepted = async (req, res, next) => {
  const keyword = req.params.keyword;
  try {
    const requests = await Request.find({
      $and: [
        {
          $or: [
            { from: req.user.userId },
            { to: req.user.userId }
          ]
        },
        { status: 'accepted' }
      ]
    });
    if (requests.length > 0) {
      const populatedRequests = await Promise.all(requests.map(async request => {
        const userId = request.from;
        const userDetails = await Auth.findById(userId);

        const userInfo = {
          userId: userDetails._id,
          userName: userDetails.userName,
        };

        return {
          ...request.toObject(),
          from: userInfo
        };
      }));

      return res.status(200).json({
        success: true,
        requests: populatedRequests
      });


    }
  } catch (error) {
    next(error)
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}


const GetMyFriends = async (req, res, next) => {
  try {
    const myFriendsFrom = await Request.find({
      from: req.user.userId,
      status: 'accepted'
    }).select('to roomCode');

    const myFriendsTo = await Request.find({
      to: req.user.userId,
      status: 'accepted'
    }).select('from roomCode');

    const fromUserIds = myFriendsFrom.map(friend => ({ userId: friend.to, roomCode: friend.roomCode }));
    const toUserIds = myFriendsTo.map(friend => ({ userId: friend.from, roomCode: friend.roomCode }));

    const allUserIds = [...fromUserIds, ...toUserIds];

    const uniqueUserIds = Array.from(new Set(allUserIds.map(user => user.userId)));

    const users = await Auth.find({ _id: { $in: uniqueUserIds } }).select('userName profile_photo');

    const friendsWithRoomCode = users.map(user => ({
      _id: user._id,
      userName: user.userName,
      profile_photo: user.profile_photo,
      roomCode: allUserIds.find(u => u.userId.toString() === user._id.toString())?.roomCode
    }));

    return res.status(200).json({ success: true, users: friendsWithRoomCode });
  } catch (error) {
    next(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const CreateGroup = async (req, res, next) => {
  const { name, participants, admin } = req.body

  const generateRoomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let roomCode = '';
    for (let i = 0; i < 8; i++) {
      roomCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return roomCode;
  };

  const room = generateRoomCode();

  try {

    const newGroup = await Group.create({
      name, participants, admin, room: room,
    })
    if (newGroup) {
      return res.status(200).json({
        success: true,
        newGroup: newGroup,
        message: 'Group has been created'
      })
    }
    return res.status(400).json({
      success: false,
      message: "Something went wrong!"
    })
  } catch (error) {
    next(error);
    console.log(error)
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}


const GetMygroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ 'participants.userId': req.user.userId });

    const result = [];

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      let latestMessage;

      const sortedMessages = group.messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (sortedMessages.length > 0) {
        latestMessage = sortedMessages[0];
      }

      result.push({
        ...group.toObject(),
        latestMessage,
        messages: i === 0 ? group.messages : undefined
      });
    }

    // Return the result
    return res.status(200).json({ success: true, groups: result });
  } catch (error) {
    next(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const GetGroupMessages = async (req, res, next) => {
  const groupid = req.params.groupid;
  try {
    const group = await Group.findById(groupid).select('messages');

    let messages = [];
    if (group && group.messages && group.messages.length > 0) {
      // Sort messages by their timestamps in ascending order (oldest to latest)
      messages = group.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    return res.status(200).json({
      success: true,
      messages: messages
    });
  } catch (error) {
    next(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const CreateMessage = async (req, res, next) => {
  const { chat, sender, content, currentRoom, media_url } = req.body;

  try {
    let messageData = { sender, content }; // Initialize the message data object with sender and content

    // Check if media_url is provided
    if (media_url) {
      messageData.media_url = media_url; // Add media_url to message data
    }
    const updatedGroup = await Group.findOneAndUpdate(
      { name: chat }, // Find the group by its name
      {
        $push: {
          messages: { sender, content } // Add the new message to the messages array
        }
      },
      { new: true } // Return the updated group document after the update
    );

    // Check if the group was found and updated successfully
    if (updatedGroup) {
      // Get the last message from the updated group
      const newMessage = updatedGroup.messages[updatedGroup.messages.length - 1];
      // Send only the created message in the response
      return res.status(200).json({
        success: true,
        message: "Message created successfully",
        newMessage
      });
    } else {
      // If the group was not found, send a 404 response
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }
  } catch (error) {
    // If an error occurs, pass it to the error handling middleware
    next(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const GetChatRoomMessages = async (req, res, next) => {
  try {
    const roomCode = req.params.roomCode;

    const chatRoom = await ChatRoom.findOne({ roomCode });

    if (!chatRoom) {
      return res.status(404).json({ success: false, message: "Chat room not found" });
    }

    const messages = chatRoom.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const participants = chatRoom.participants;

    return res.status(200).json({ success: true, messages, participants, roomId: chatRoom._id });
  } catch (error) {
    console.error("Error fetching chat room messages:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};





const CreateChatRoomMessage = async (req, res, next) => {
  try {
    const { roomId, room, sender, content, media_url, user_profile } = req.body;

    let messageData = { sender, content, room, roomId, user_profile };

    if (media_url) {
      messageData.media_url = media_url;
    }

    const chatRoom = await ChatRoom.findById(messageData.roomId);
    if (!chatRoom) {
      return res.status(404).json({ success: false, message: "Chat room not found" });
    }

    const newMessage = {
      content: messageData.content,
      media_url: messageData.media_url,
      sender: messageData.sender,
      user_profile: messageData.user_profile,
      createdAt: new Date()
    };

    chatRoom.messages.push(newMessage);

    await chatRoom.save();

    const messageId = chatRoom.messages[chatRoom.messages.length - 1]._id;

    return res.status(200).json({ success: true, message: "Message created successfully", newMessage: { ...newMessage, _id: messageId } });
  } catch (error) {
    console.error("Error creating chat room message:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const GetAnnouncements = async (req, res, next) => {
  try {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const announcements = await Announcement.find({ createdAt: { $gte: fiveDaysAgo } })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, announcements });
  } catch (error) {
    console.error("Error getting announcements:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const GetEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, events });
  } catch (error) {
    console.error("Error getting events:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const DeleteGroupMemeber = async (req, res, next) => {
  try {
    const { groupid, participantid } = req.body;
    const group = await Group.findByIdAndUpdate(
      groupid,
      { $pull: { participants: { userId: participantid } } },
      { new: true }
    );

    if (!group) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }

    return res.status(200).json({ success: true, message: "Participant deleted successfully", conversation: group });
  } catch (error) {
    console.error("Error deleting participant:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

const UpdateProfilePhoto = async (req, res, next) => {
  try {
    const { newprofile } = req.body;

    await Auth.findByIdAndUpdate(req.user.userId, { profile_photo: newprofile });

    res.status(200).json({ message: 'Profile photo updated successfully', success: true });
  } catch (error) {
    console.error('Error updating profile photo:', error);
    res.status(500).json({ error: 'Internal server error', success: false });
  }
};


const UpdateUserName = async (req, res, next) => {
  try {
    const { newUsername } = req.body;

    await Auth.findByIdAndUpdate(req.user.userId, { userName: newUsername });
    res.status(200).json({ message: 'Username updated successfully', success: true });
  } catch (error) {
    console.error('Error updating profile photo:', error);
    res.status(500).json({ error: 'Internal server error', success: false });
  }
}


module.exports = { profile, GetUserInfo, GetUserInfoByUsername, UpdateProfilePhoto, UpdateUserName, DeleteGroupMemeber, CreateMessage, DeleteGroupMemeber, GetGroupMessages, GetEvents, GetAnnouncements, CreateChatRoomMessage, GetMygroups, GetChatRoomMessages, GetMyFriends, GetUsersAccepted, SearchUserByKeyword, GetUserInfoUsername, SendFriendRequest, GetFriendRequests, AcceptFriendRequest, CreateGroup };