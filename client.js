const prompt = require('prompt');
const util = require('util');
const axios = require('axios');
const {
    ChatManager,
    TokenProvider
} = require('@pusher/chatkit');
const {
    JSDOM
} = require('jsdom');
const readline = require('readline');

const makeChatkitNodeCompatible = () => {
    const {
        window
    } = new JSDOM();
    global.window = window;
    global.navigator = {};
};

const createUser = async (username) => {
    try {
        await axios.post('http://localhost:3001/users', {
            username
        });
    } catch (error) {
        console.error(error)
    }

}

const main = async () => {
    makeChatkitNodeCompatible()
    try {
        prompt.start()
        prompt.message = ''

        const get = util.promisify(prompt.get)

        const userName = [{
            description: 'Enter your username',
            name: 'username',
            required: true
        }]

        const {
            username
        } = await get(userName)
        await createUser(username)

        const chatManager = new ChatManager({
            instanceLocator: 'v1:us1:4860b319-0a0e-40b2-beab-916e7f41d529',
            userId: username,
            tokenProvider: new TokenProvider({
                url: 'http://localhost:3001/authenticate'
            })
        })

        const currentUser = await chatManager.connect()

        const joinableRooms = await currentUser.getJoinableRooms()
        const availableRooms = [...currentUser.rooms, ...joinableRooms]
        availableRooms.forEach((room, index) => {
            console.log(`${index} - ${room.name}`)
        })

        const roomStructure = [{
            description: 'Select a room',
            name: 'chosenRoom',
            required: true
        }]
        const {
            chosenRoom
        } = await get(roomStructure)
        const room = availableRooms[chosenRoom]

        await currentUser.subscribeToRoom({
            roomId: room.id,
            hooks: {
                onNewMessage: message => {
                    if (message.senderId !== username)
                        console.log(`${message.senderId} - ${message.text}`)
                }
            },
            messageLimit: 0
        })

        const input = readline.createInterface({
            input: process.stdin
        })

        input.on('line', async text => {
            await currentUser.sendMessage({
                roomId: room.id,
                text
            })
        })
    } catch (error) {
        console.error(error)
        process.exit(1)
    }

}

main()