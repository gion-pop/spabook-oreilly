/**
 * Created by gion on 3/7/15.
 */

/* global TAFFY, $, spa */

spa.model = function() {
    "use strict";

    var configMap = {
            anon_id: 'a0'
        },
        stateMap = {
            anon_user: null,
            cid_serial: 0,
            people_cid_map: {},
            people_db: TAFFY(),
            user: null,
            is_connected: false
        },
        isFakeData = false,
        personProto,
        makeCid,
        clearPeopleDB,
        completeLogin,
        makePerson,
        removePerson,
        people,
        chat,
        initModule;


    personProto = {
        get_is_user: function() {
            return this.cid === stateMap.user.cid;
        },
        get_is_anon: function() {
            return this.cid === stateMap.anon_user.cid;
        }
    };


    makeCid = function() {
        return 'c' + String(stateMap.cid_serial++);
    };


    clearPeopleDB = function() {
        var user = stateMap.user;
        stateMap.people_db = TAFFY();
        stateMap.people_cid_map = {};
        if (user) {
            stateMap.people_db.insert(user);
            stateMap.people_cid_map[user.cid] = user;
        }
    };


    completeLogin = function(user_list) {
        var user_map = user_list[0];
        delete stateMap.people_cid_map[user_map.cid];
        stateMap.user.cid = user_map._id;
        stateMap.user.id = user_map._id;
        stateMap.user.css_map = user_map.css_map;
        stateMap.people_cid_map[user_map._id] = stateMap.user;
        chat.join();
        $.gevent.publish('spa-login', [stateMap.user]);
    };


    makePerson = function(person_map) {
        var person,
            cid = person_map.cid,
            css_map = person_map.css_map,
            id = person_map.id,
            name = person_map.name;

        if (cid === undefined || !name) {
            throw 'client id and name required';
        }

        person = Object.create(personProto);
        person.cid = cid;
        person.name = name;
        person.css_map = css_map;

        if (id) {
            person.id = id;
        }

        stateMap.people_cid_map[cid] = person;
        stateMap.people_db.insert(person);
        return person;
    };


    removePerson = function(person) {
        if (!person) {
            return false;
        }
        if (person.id === configMap.anon_id) {
            return false;
        }

        stateMap.people_db({cid: person.cid}).remove();
        if (person.cid) {
            delete stateMap.people_cid_map[person.cid];
        }
        return true;
    };


    people = (function() {
        var get_by_cid,
            get_db,
            get_user,
            login,
            logout;


        /**
         * Get a person object with provided unique id.
         * @param cid cid of user
         * @returns {*} selected person objectb
         */
        get_by_cid = function (cid) {
            return stateMap.people_cid_map[cid];
        };


        /**
         * Get the TaffyDB database of all the person objects
         *     - including the current user - presorted.
         * @returns database of persons
         */
        get_db = function () {
            return stateMap.people_db;
        };


        /**
         * Get the current user person object.
         *     If the current user is not signed-in, an anonymous person object is returned.
         * @returns current person object
         */
        get_user = function () {
            return stateMap.user;
        };


        /**
         * Login as the user with the provided user name.
         *     The current user object is changed to reflect the new identity.
         *     Successful completion of login publishes a 'spa-login' global custom event.
         * @param name name of person
         */
        login = function (name) {
            var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();

            stateMap.user = makePerson({
                cid: makeCid(),
                css_map: {
                    top: 25,
                    left: 25,
                    'background-color': '#8f8'
                },
                name: name
            });

            sio.on('userupdate', completeLogin);

            sio.emit('adduser', {
                cid: stateMap.user.cid,
                css_map: stateMap.user.css_map,
                name: stateMap.user.name
            });
        };


        /**
         * Revert the current user object to anonymous.
         *     This method publishes a 'spa-logout' global custom event.
         */
        logout = function () {
            var user = stateMap.user;

            chat._leave();
            stateMap.user = stateMap.anon_user;
            clearPeopleDB();

            $.gevent.publish('spa-logout', [user]);
        };


        return {
            get_by_cid: get_by_cid,
            get_db: get_db,
            get_user: get_user,
            login: login,
            logout: logout
        };
    }());


    chat = (function() {
        var _publish_listchange,
            _publish_updatechat,
            _update_list,
            _leave_chat,
            get_chatee,
            join_chat,
            send_msg,
            set_chatee,
            update_avater,
            chatee = null;


        _update_list = function(arg_list) {
            var i, person_map, make_person_map, person,
                people_list = arg_list[0],
                is_chatee_online = false;

            clearPeopleDB();

            for (i = 0; i < people_list.length; i++) {
                person_map = people_list[i];

                if (!person_map.name) {
                    continue;
                }

                if (stateMap.user && stateMap.user.id === person_map._id) {
                    stateMap.user.css_map = person_map.css_map;
                    continue;
                }

                make_person_map = {
                    cid: person_map._id,
                    css_map: person_map.css_map,
                    id: person_map._id,
                    name: person_map.name
                };
                person = makePerson(make_person_map);

                if (chatee && chatee.id === make_person_map.id) {
                    is_chatee_online = true;
                }
            }

            stateMap.people_db.sort('name');

            if (chatee && !is_chatee_online) {
                set_chatee('');
            }
        };


        _publish_updatechat = function(arg_list) {
            var msg_map = arg_list[0];

            if (!chatee) {
                set_chatee(msg_map.sender_id);
            } else if (msg_map.sender_id !== stateMap.user.id && msg_map.sender_id !== chatee.id) {
                set_chatee(msg_map.sender_id);
            }

            $.gevent.publish('spa-updatechat', [msg_map]);
        }


        _publish_listchange = function(arg_list) {
            _update_list(arg_list);
            $.gevent.publish('spa-listchange', [arg_list]);
        };


        _leave_chat = function() {
            var sio = isFakeData? spa.fake.mockSio: spa.data.getSio();
            chatee = null;
            stateMap.is_connected = false;
            if (sio) {
                sio.emit('leavechat');
            }
        };


        /**
         * Get the person object with whom the user is chatting with.
         * @returns null if there is no chatee, else chatee
         */
        get_chatee = function() {
            return chatee;
        };


        /**
         * Joins the chat room.
         * This routine sets up the chat protocol with the backend including
         * publishers for 'spa-listchange' and 'spa-updatechat' global custom events.
         * @returns {boolean} false if the current user is anonymous
         */
        join_chat = function() {
            var sio;

            if (stateMap.is_connected) {
                return false;
            }

            if (stateMap.user.get_is_anon()) {
                console.warn('User must be defined before joining chat');
                return false;
            }

            sio = isFakeData? spa.fake.mockSio: spa.data.getSio();
            sio.on('listchange', _publish_listchange);
            sio.on('updatechat', _publish_updatechat);
            stateMap.is_connected = true;
            return true;
        };


        /**
         * Send a message to the chatee.
         * It publishes a 'spa-updatechat' global custom event.
         * @param msg_text message
         * @returns {boolean} false if the user is anonymous or the chatee is null
         */
        send_msg = function(msg_text) {
            var msg_map,
                sio = isFakeData? spa.fake.mockSio: spa.data.getSio();

            if (!sio) {
                return false;
            }
            if (!(stateMap.user && chatee)) {
                return false;
            }

            msg_map = {
                dest_id: chatee.id,
                dest_name: chatee.name,
                sender_id: stateMap.user.id,
                msg_text: msg_text
            };

            _publish_updatechat([msg_map]);
            sio.emit('updatechat', msg_map);

            return true;
        };


        /**
         * Set the chatee to the person identified by person_id.
         * If the person_id does not exist in the people list, the chatee is set to null.
         * It publishes a 'spa-setchatee' global custom event.
         * @param person_id person_id of chatee
         * @returns {boolean} false if the person requested is already the chatee
         */
        set_chatee = function(person_id) {
            var new_chatee;
            new_chatee = stateMap.people_cid_map[person_id];
            if (new_chatee) {
                if (chatee && chatee.id === new_chatee.id) {
                    return false;
                }
            } else {
                new_chatee = null;
            }

            $.gevent.publish('spa-setchatee', {
                old_chatee: chatee,
                new_chatee: new_chatee
            });
            chatee = new_chatee;

            return true;
        };


        /**
         * Send the update_avtr_map to the backend.
         * This results in an 'spa-listchange' event which publishes the updated
         * people list and avatar information (the css_map in the person objects).
         * The update_avtr_map must have the form:
         * { person_id : person_id, css_map : css_map }
         * @param avatar_update_map
         */
        update_avater = function(avatar_update_map) {
            var sio = isFakeData? spa.fake.mockSio: spa.data.getSio();
            if (sio) {
                sio.emit('updateavatar', avatar_update_map);
            }
        };


        return {
            _leave: _leave_chat,
            get_chatee: get_chatee,
            join: join_chat,
            send_msg: send_msg,
            set_chatee: set_chatee,
            update_avatar: update_avater
        };
    })();


    initModule = function() {
        stateMap.anon_user = makePerson({
            cid: configMap.anon_id,
            id: configMap.anon_id,
            name: 'Anonymous'
        });
        stateMap.user = stateMap.anon_user;
    };


    return {
        initModule: initModule,
        chat: chat,
        people: people
    };
}();
