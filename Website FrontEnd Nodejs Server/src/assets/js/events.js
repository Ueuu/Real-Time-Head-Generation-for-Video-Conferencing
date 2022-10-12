
import helpers from './helpers.js';


window.addEventListener( 'load', () => {
    
    document.getElementById('connectserver').addEventListener('click', ( e ) => {
        
        

        

        var socket = new WebSocket("ws://localhost:1243");
        var canvas = document.getElementById("canvas");

        var conserver= document.getElementById('connectserver');
        var capserver = document.getElementById('captureserver');
        
        let change_video_src_temp = true;
        canvas.height = 400;
        canvas.width = 400;

        socket.onopen = function(e) {
            alert("[open] Connection established");
            //alert("Sending to server");
            socket.send("My name is Varun");
            conserver.hidden = true;
            capserver.hidden = false;

            
            init_keys(socket);
          };
          
          socket.onmessage = function(event) {
            //alert(`[message] Data received from server: ${event.data}`);
            //console.log( event.data)

            
            

            var ctx = canvas.getContext("2d");

            //const data =  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9oMCRUiMrIBQVkAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAADElEQVQI12NgoC4AAABQAAEiE+h1AAAAAElFTkSuQmCC";
            const arrayBuffer = event.data;
            var image = new Image();
            image.onload = function() {
                ctx.drawImage(image, 0, 0, 400 , 400);
            };
            image.src = 'data:image/jpg;base64,' + arrayBuffer;

            const video1 = document.getElementById('video1');
            
            if(video1.hidden==true){
                video1.hidden = false;
            
                const canvas_stream = canvas.captureStream(20);
                
                let video1stream = null ; 
                try{
                    video1.srcObject = canvas_stream;
                    
                } 
                catch(err){
                    console.log("error := " + err);
                }
            }
            if(change_video_src_temp){
                video1.height = canvas.videoHeight;
                video1.width = canvas.videoWidth;
                change_video__src();
                change_video_src_temp = false;
                
            }
            
            
            
          };
          
          socket.onclose = function(event) {
            if (event.wasClean) {
              alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            } else {
              // e.g. server process killed or network down
              // event.code is usually 1006 in this case
              alert('[close] Connection died');
            }
          };
          
          socket.onerror = function(error) {
            alert(`[error] ${error.message}`);
          };
          
        

        
    });
    let socket1;
    document.getElementById('captureserver').addEventListener('click', ( e ) => {
        var canvas = document.getElementById("canvas1");
        var video = document.getElementById('local');
        var context = canvas.getContext('2d');
        
        //set size proportional to image
        

        //step 1 - resize to 50%
        var oc = document.createElement('canvas'),
        octx = oc.getContext('2d');

        oc.width = 256;
        oc.height = 256;
        octx.drawImage(video, 0, 0, oc.width, oc.height);

        // step 2
        octx.drawImage(oc, 0, 0, oc.width , oc.height );

        // step 3, resize to final size
        context.drawImage(oc, 0, 0, oc.width, oc.height,
        0, 0, canvas.width, canvas.height);
        
        //context.drawImage(video, 100, 100 ,  );



        var dataURL = canvas.toDataURL("image/png");
        send_img(dataURL);
        helpers.stopVideoStream();
    });
    
    async function send_img(img){
        await socket1.send(img)
    }
    
    function init_keys(socket){
        socket1 = socket;
        window.addEventListener( 'keydown', (event) => {
            if(event.key=='x'){
                console.log("X is pressed");
                socket1.send(dataURL);
            }
        });
    }
    function change_video__src(){
        const video1 = document.getElementById('video1');
        var pc = helpers.pc.pc1;
        let stream = video1.srcObject ; 
        let track = stream.getVideoTracks()[0];
        console.log("pc = " + pc + " = len =  " + typeof pc);
        for ( let p in pc ) {
            console.log("this is it " +  p);
            let pName = pc[p];
            console.log("this is it " +  pName);
            if ( typeof pc[pName] == 'object' ) {
                helpers.replaceTrack( track, pc[pName] );
            }
        }
    }
   
    
    
    

    
    
    



    


    //When the video frame is clicked. This will enable picture-in-picture
    document.getElementById( 'local' ).addEventListener( 'click', () => {
        if ( !document.pictureInPictureElement ) {
            document.getElementById( 'local' ).requestPictureInPicture()
                .catch( error => {
                    // Video failed to enter Picture-in-Picture mode.
                    console.error( error );
                } );
        }

        else {
            document.exitPictureInPicture()
                .catch( error => {
                    // Video failed to leave Picture-in-Picture mode.
                    console.error( error );
                } );
        }
    } );


    //When the 'Create room" is button is clicked
    document.getElementById( 'create-room' ).addEventListener( 'click', ( e ) => {
        e.preventDefault();

        let roomName = document.querySelector( '#room-name' ).value;
        let yourName = document.querySelector( '#your-name' ).value;

        if ( roomName && yourName ) {
            //remove error message, if any
            document.querySelector('#err-msg').innerText = "";

            //save the user's name in sessionStorage
            sessionStorage.setItem( 'username', yourName );

            //create room link
            let roomLink = `${ location.origin }?room=${ roomName.trim().replace( ' ', '_' ) }_${ helpers.generateRandomString() }`;

            //show message with link to room
            document.querySelector( '#room-created' ).innerHTML = `Room successfully created. Click <a href='${ roomLink }'>here</a> to enter room. 
                Share the room link with your partners.`;

            //empty the values
            document.querySelector( '#room-name' ).value = '';
            document.querySelector( '#your-name' ).value = '';
        }

        else {
            document.querySelector('#err-msg').innerText = "All fields are required";
        }
    } );


    //When the 'Enter room' button is clicked.
    document.getElementById( 'enter-room' ).addEventListener( 'click', ( e ) => {
        e.preventDefault();

        let name = document.querySelector( '#username' ).value;

        if ( name ) {
            //remove error message, if any
            document.querySelector('#err-msg-username').innerText = "";

            //save the user's name in sessionStorage
            sessionStorage.setItem( 'username', name );

            //reload room
            location.reload();
        }

        else {
            document.querySelector('#err-msg-username').innerText = "Please input your name";
        }
    } );


    document.addEventListener( 'click', ( e ) => {
        if ( e.target && e.target.classList.contains( 'expand-remote-video' ) ) {
            helpers.maximiseStream( e ); 
        }

        else if ( e.target && e.target.classList.contains( 'mute-remote-mic' ) ) {
            helpers.singleStreamToggleMute( e );
        }
    } );


    
} );
