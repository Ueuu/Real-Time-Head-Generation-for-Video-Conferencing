var pc = {pc1 : ''};

export default {
    pc , 
    
    generateRandomString() {
        const crypto = window.crypto || window.msCrypto;
        let array = new Uint32Array(1);
        
        return crypto.getRandomValues(array);
    },
    
    
    
    storePc(sdf){
        pc.pc1 = sdf.dt;
    },
    printPc(){
        console.log(pc.pc1);
    },
    closeVideo( elemId ) {
        if ( document.getElementById( elemId ) ) {
            document.getElementById( elemId ).remove();
            this.adjustVideoElemSize();
        }
    },


    pageHasFocus() {
        return !( document.hidden || document.onfocusout || window.onpagehide || window.onblur );
    },


    getQString( url = '', keyToReturn = '' ) {
        url = url ? url : location.href;
        let queryStrings = decodeURIComponent( url ).split( '#', 2 )[0].split( '?', 2 )[1];

        if ( queryStrings ) {
            let splittedQStrings = queryStrings.split( '&' );

            if ( splittedQStrings.length ) {
                let queryStringObj = {};

                splittedQStrings.forEach( function ( keyValuePair ) {
                    let keyValue = keyValuePair.split( '=', 2 );

                    if ( keyValue.length ) {
                        queryStringObj[keyValue[0]] = keyValue[1];
                    }
                } );

                return keyToReturn ? ( queryStringObj[keyToReturn] ? queryStringObj[keyToReturn] : null ) : queryStringObj;
            }

            return null;
        }

        return null;
    },


    userMediaAvailable() {
        return !!( navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia );
    },


    getUserFullMedia() {
        console.log("debug " + this.userMediaAvailable());
        if ( this.userMediaAvailable() ) {
            return navigator.mediaDevices.getUserMedia( {
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            } );
        }

        else {
            throw new Error( 'User media not available done' );
        }
    },


    getUserAudio() {
        if ( this.userMediaAvailable() ) {
            return navigator.mediaDevices.getUserMedia( {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            } );
        }

        else {
            throw new Error( 'User media not available' );
        }
    },



    


    getIceServer() {
        return {
            // "turn:bn-turn1.xirsys.com:3478?transport=tcp",
            // "turns:bn-turn1.xirsys.com:443?transport=tcp",
            // "turns:bn-turn1.xirsys.com:5349?transport=tcp"
            iceServers: [{
                urls: [ "stun:bn-turn1.xirsys.com" ]
             }, {
                username: "0WvlcKW8fwXncxroQ5w3Gj2k2_4-v0qPJrdveUxVjxv5VMyGa479YvV6OEkZPAhZAAAAAGF8slB2YXVuODA1NQ==",
                credential: "c211e382-392b-11ec-ab86-0242ac140004",
                urls: [
                    
                    "turn:bn-turn1.xirsys.com:3478?transport=udp",
                    "turn:bn-turn1.xirsys.com:3478?transport=tcp"
                    
                   
                ]
             }]
        };
    },


    



    replaceTrack( stream, recipientPeer ) {
        let sender;
        if(recipientPeer.getSenders){
            console.log("Version Replace Track In recipientPeer");
            sender =recipientPeer.getSenders().find( s => s.track && s.track.kind === stream.kind );
        }
        else{
            console.log("Version Replace Track In false");

            sender =false;
        }

        if(sender){
            console.log("Version Replace Track In True");
            sender.replaceTrack( stream );
        }
        


        // let sender = recipientPeer.getSenders ? recipientPeer.getSenders().find( s => s.track && s.track.kind === stream.kind ) : false;

        // sender ? sender.replaceTrack( stream ) : '';
    },



    


    toggleVideoBtnDisabled( disabled ) {
        // function stopVideoStream() {
        //     const stream = videoElement.srcObject;
          
        //     stream.getTracks().forEach(track => track.stop());
        //     videoElement.srcObject = null;
        //   }
        console.log("toggle video click " + document.getElementById( 'toggle-video' ));
          
        document.getElementById( 'toggle-video' ).disabled = disabled;
    },


    maximiseStream( e ) {
        let elem = e.target.parentElement.previousElementSibling;

        elem.requestFullscreen() || elem.mozRequestFullScreen() || elem.webkitRequestFullscreen() || elem.msRequestFullscreen();
    },


    singleStreamToggleMute( e ) {
        if ( e.target.classList.contains( 'fa-microphone' ) ) {
            e.target.parentElement.previousElementSibling.muted = true;
            e.target.classList.add( 'fa-microphone-slash' );
            e.target.classList.remove( 'fa-microphone' );
        }

        else {
            e.target.parentElement.previousElementSibling.muted = false;
            e.target.classList.add( 'fa-microphone' );
            e.target.classList.remove( 'fa-microphone-slash' );
        }
    },


    
    stopVideoStream() {
        console.log("I am in Stop Video");
        
        //const stream = videoElement.srcObject;
        const localEl = document.getElementById( 'local' );

        var myStream = localEl.srcObject;
        myStream.getTracks().forEach(track => track.stop());
        localEl.srcObject = null;
    },

    toggleModal( id, show ) {
        let el = document.getElementById( id );

        if ( show ) {
            el.style.display = 'block';
            el.removeAttribute( 'aria-hidden' );
        }

        else {
            el.style.display = 'none';
            el.setAttribute( 'aria-hidden', true );
        }
    },



    setLocalStream( stream, mirrorMode = true ) {
        
        const localVidElem = document.getElementById( 'local' );

        localVidElem.srcObject = stream;
        mirrorMode ? localVidElem.classList.add( 'mirror-mode' ) : localVidElem.classList.remove( 'mirror-mode' );
    },



    adjustVideoElemSize() {
        let elem = document.getElementsByClassName( 'card' );
        let totalRemoteVideosDesktop = elem.length;
        let newWidth = totalRemoteVideosDesktop <= 2 ? '50%' : (
            totalRemoteVideosDesktop == 3 ? '33.33%' : (
                totalRemoteVideosDesktop <= 8 ? '25%' : (
                    totalRemoteVideosDesktop <= 15 ? '20%' : (
                        totalRemoteVideosDesktop <= 18 ? '16%' : (
                            totalRemoteVideosDesktop <= 23 ? '15%' : (
                                totalRemoteVideosDesktop <= 32 ? '12%' : '10%'
                            )
                        )
                    )
                )
            )
        );


        for ( let i = 0; i < totalRemoteVideosDesktop; i++ ) {
            elem[i].style.width = newWidth;
        }
    },


    createDemoRemotes( str, total = 6 ) {
        console.log("sucessfuly in create demo remote ");
        let i = 0;

        let testInterval = setInterval( () => {
            let newVid = document.createElement( 'video' );
            newVid.id = `demo-${ i }-video`;
            newVid.srcObject = str;
            newVid.autoplay = true;
            newVid.className = 'remote-video';

            //video controls elements
            let controlDiv = document.createElement( 'div' );
            controlDiv.className = 'remote-video-controls';
            controlDiv.innerHTML = `<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`;

            //create a new div for card
            let cardDiv = document.createElement( 'div' );
            cardDiv.className = 'card card-sm';
            cardDiv.id = `demo-${ i }`;
            cardDiv.appendChild( newVid );
            cardDiv.appendChild( controlDiv );

            //put div in main-section elem
            document.getElementById( 'videos' ).appendChild( cardDiv );

            this.adjustVideoElemSize();

            i++;

            if ( i == total ) {
                clearInterval( testInterval );
            }
        }, 2000 );
    }
};
