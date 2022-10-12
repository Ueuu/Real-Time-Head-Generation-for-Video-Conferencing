# FOr CV2 data cpature not getting from browser 
from sys import platform as _platform
import glob
import asyncio
import yaml
import numpy as np
import cv2
import os

from afy.videocaptureasync import VideoCaptureAsync
from afy.arguments import opt
from afy.utils import info, Once, Tee, crop, pad_img, resize, TicToc
import afy.camera_selector as cam_selector

import websockets
import base64

log = Tee('./var/log/cam_fomm.log')
IMG_SIZE = 256
# Where to split an array from face_alignment to separate each landmark
LANDMARK_SLICE_ARRAY = np.array([17, 22, 27, 31, 36, 42, 48, 60])

if _platform == 'darwin':
    if not opt.is_client:
        info('\nOnly remote GPU mode is supported for Mac (use --is-client and --connect options to connect to the server)')
        info('Standalone version will be available lately!\n')
        exit()


def is_new_frame_better(source, driving, predictor):
    global avatar_kp
    global display_string
    
    if avatar_kp is None:
        display_string = "No face detected in avatar."
        return False
    
    if predictor.get_start_frame() is None:
        display_string = "No frame to compare to."
        return True
    
    driving_smaller = resize(driving, (128, 128))[..., :3]
    new_kp = predictor.get_frame_kp(driving)
    
    if new_kp is not None:
        new_norm = (np.abs(avatar_kp - new_kp) ** 2).sum()
        old_norm = (np.abs(avatar_kp - predictor.get_start_frame_kp()) ** 2).sum()
        
        out_string = "{0} : {1}".format(int(new_norm * 100), int(old_norm * 100))
        display_string = out_string
        log(out_string)
        
        return new_norm < old_norm
    else:
        display_string = "No face found!"
        return False



def load_images(IMG_SIZE = 256):
    avatars = []
    filenames = []
    images_list = sorted(glob.glob(f'{opt.avatars}/*'))
    for i, f in enumerate(images_list):
        if f.endswith('.jpg') or f.endswith('.jpeg') or f.endswith('.png'):
            img = cv2.imread(f)
            if img is None:
                log("Failed to open image: {}".format(f))
                continue

            if img.ndim == 2:
                img = np.tile(img[..., None], [1, 1, 3])
            img = img[..., :3][..., ::-1]
            img = resize(img, (IMG_SIZE, IMG_SIZE))
            avatars.append(img)
            filenames.append(f)
    return avatars, filenames

def change_avatar(predictor, new_avatar):
    global avatar, avatar_kp, kp_source
    avatar_kp = predictor.get_frame_kp(new_avatar)
    kp_source = None
    avatar = new_avatar
    predictor.set_source_image(avatar)


def kp_to_pixels(arr):
    '''Convert normalized landmark locations to screen pixels'''
    return ((arr + 1) * 127).astype(np.int32)

def draw_face_landmarks(img, face_kp, color=(20, 80, 255)):
    if face_kp is not None:
        img = cv2.polylines(img, np.split(kp_to_pixels(face_kp), LANDMARK_SLICE_ARRAY), False, color)

def print_help(avatar_names):
    pass

def select_camera(config):
    cam_config = config['cam_config']
    cam_id = None

    if os.path.isfile(cam_config):
        with open(cam_config, 'r') as f:
            cam_config = yaml.load(f, Loader=yaml.FullLoader)
            cam_id = cam_config['cam_id']
    else:
        cam_frames = cam_selector.query_cameras(config['query_n_cams'])

        if cam_frames:
            if len(cam_frames) == 1:
                cam_id = list(cam_frames)[0]
            else:
                cam_id = cam_selector.select_camera(cam_frames, window="CLICK ON YOUR CAMERA")
            log(f"Selected camera {cam_id}")

            with open(cam_config, 'w') as f:
                yaml.dump({'cam_id': cam_id}, f)
        else:
            log("No cameras are available")

    return cam_id




from PIL import Image
import io
def stringToRGB(base64_string):
    imgdata = base64.b64decode(str(base64_string))
    
    image = Image.open(io.BytesIO(imgdata))
    
    return cv2.cvtColor(np.array(image), cv2.COLOR_BGR2RGB)

def image_to_base64(img: np.ndarray) -> bytes:
    """ Given a numpy 2D array, returns a JPEG image in base64 format """

    # using opencv 2, there are others ways
    img_buffer = cv2.imencode('.jpg', img)[1]
    return base64.b64encode(img_buffer).decode('utf-8')



    
    

    
   
    


websockets1 = ''



async def capture_first_image(websocket):
    s = await websocket.recv()
    
    img_data = s[22:]

    imgdata = base64.b64decode(img_data)
    filename = 'avatars/a.png'  
    with open(filename, 'wb') as f:
        f.write(imgdata)


    


log('Loading Predictor')
predictor_args = {
    'config_path': opt.config,
    'checkpoint_path': opt.checkpoint,
    'relative': opt.relative,
    'adapt_movement_scale': opt.adapt_scale,
    'enc_downscale': opt.enc_downscale
}

from afy import predictor_local
predictor = predictor_local.PredictorLocal(
    **predictor_args
)
log('Loading Predictor Load Sucessfully')
print("Waiting for client...")

async def run_forever(websocket):

    
    msg = await websocket.recv()
    print(msg)
    

    await capture_first_image(websocket)
    
    with open('config.yaml', 'r') as f:
        config = yaml.load(f, Loader=yaml.FullLoader)
    global display_string
    display_string = ""

    IMG_SIZE = 256

    

    cam_id = select_camera(config)

    if cam_id is None:
        exit(1)

    cap = VideoCaptureAsync(cam_id)
    cap.start()

    print("loading images Start!")
    avatars, avatar_names = load_images()
    print("loaded images sucessfully!")
    

    cur_ava = 1  
    avatar = None
    change_avatar(predictor, avatars[cur_ava])
    passthrough = False

    cv2.namedWindow('cam', cv2.WINDOW_GUI_NORMAL)
    cv2.moveWindow('cam', 700, 250)

    frame_proportion = 0.9
    frame_offset_x = 0
    frame_offset_y = 0

    overlay_alpha = 0.0
    preview_flip = False
    output_flip = False
    find_keyframe = False
    is_calibrated = False

    show_landmarks = False

   

    print_help(avatar_names)
    
    
    tempvarun = True
    
    try:
        while True:
            
            

            tt = TicToc()

            timing = {
                'preproc': 0,
                'predict': 0,
                'postproc': 0
            }

            green_overlay = False

            tt.tic()

            ret, frame = cap.read()
           
            if not ret:
                log("Can't receive frame (stream end?). Exiting ...")
                break
            
            
            
            frame = frame[..., ::-1]
            frame_orig = frame.copy()

            frame, (frame_offset_x, frame_offset_y) = crop(frame, p=frame_proportion, offset_x=frame_offset_x, offset_y=frame_offset_y)

            frame = resize(frame, (IMG_SIZE, IMG_SIZE))[..., :3]

            if find_keyframe:
                if is_new_frame_better(avatar, frame, predictor):
                    log("Taking new frame!")
                    green_overlay = True
                    predictor.reset_frames()

            timing['preproc'] = tt.toc()

            if passthrough:
                out = frame
            elif is_calibrated:
                
                tt.tic()
                out = predictor.predict(frame)
                out = np.transpose(out['prediction'].data.cpu().numpy(), [0, 2, 3, 1])[0]
                out = (np.clip(out, 0, 1) * 255).astype(np.uint8)
                
                if out is None:
                    log('predict returned None')
                timing['predict'] = tt.toc()
            else:
                out = None

            tt.tic()
            
            key = cv2.waitKey(1)

            

            if key == 27: # ESC
                break
            elif key == ord('d'):
                cur_ava += 1
                if cur_ava >= len(avatars):
                    cur_ava = 0
                passthrough = False
                change_avatar(predictor, avatars[cur_ava])
            elif key == ord('a'):
                cur_ava -= 1
                if cur_ava < 0:
                    cur_ava = len(avatars) - 1
                passthrough = False
                change_avatar(predictor, avatars[cur_ava])
            elif key == ord('w'):
                frame_proportion -= 0.05
                frame_proportion = max(frame_proportion, 0.1)
            elif key == ord('s'):
                frame_proportion += 0.05
                frame_proportion = min(frame_proportion, 1.0)
            elif key == ord('H'):
                frame_offset_x -= 1
            elif key == ord('h'):
                frame_offset_x -= 5
            elif key == ord('K'):
                frame_offset_x += 1
            elif key == ord('k'):
                frame_offset_x += 5
            elif key == ord('J'):
                frame_offset_y -= 1
            elif key == ord('j'):
                frame_offset_y -= 5
            elif key == ord('U'):
                frame_offset_y += 1
            elif key == ord('u'):
                frame_offset_y += 5
            elif key == ord('Z'):
                frame_offset_x = 0
                frame_offset_y = 0
                frame_proportion = 0.9
            elif key == ord('x'):
                predictor.reset_frames()
                info('reset done')
                if not is_calibrated:
                    
                    pass
                
                is_calibrated = True
                show_landmarks = False
            elif key == ord('z'):
                overlay_alpha = max(overlay_alpha - 0.1, 0.0)
            elif key == ord('c'):
                overlay_alpha = min(overlay_alpha + 0.1, 1.0)
            elif key == ord('r'):
                preview_flip = not preview_flip
            elif key == ord('t'):
                output_flip = not output_flip
            elif key == ord('f'):
                find_keyframe = not find_keyframe
            elif key == ord('o'):
                show_landmarks = not show_landmarks
            elif key == ord('l'):
                try:
                    log('Reloading avatars...')
                    avatars, avatar_names = load_images()
                    passthrough = False
                    log("Images reloaded")
                except:
                    log('Image reload failed')
            elif 48 < key < 58:
                cur_ava = min(key - 49, len(avatars) - 1)
                passthrough = False
                change_avatar(predictor, avatars[cur_ava])
            elif key == 48:
                passthrough = not passthrough
            elif key != -1:
                log(key)

            if overlay_alpha > 0:
                preview_frame = cv2.addWeighted( avatar, overlay_alpha, frame, 1.0 - overlay_alpha, 0.0)
            else:
                preview_frame = frame.copy()

            if show_landmarks:
                
                preview_frame = cv2.convertScaleAbs(preview_frame, alpha=0.5, beta=0.0)

                draw_face_landmarks(preview_frame, avatar_kp, (200, 20, 10))
                frame_kp = predictor.get_frame_kp(frame)
                draw_face_landmarks(preview_frame, frame_kp)
            
            if preview_flip:
                preview_frame = cv2.flip(preview_frame, 1)
                
            if green_overlay:
                green_alpha = 0.8
                overlay = preview_frame.copy()
                overlay[:] = (0, 255, 0)
                preview_frame = cv2.addWeighted( preview_frame, green_alpha, overlay, 1.0 - green_alpha, 0.0)

            timing['postproc'] = tt.toc()
                
            if find_keyframe:
                preview_frame = cv2.putText(preview_frame, display_string, (10, 220), 0, 0.5 * IMG_SIZE / 256, (255, 255, 255), 1)

           
            #cv2.imshow('cam', preview_frame[..., ::-1])
            

            if out is not None:
                

                if output_flip:
                    out = cv2.flip(out, 1)

                
                basedata = image_to_base64(out[..., ::-1])
                
                await websocket.send(basedata)
                
    except KeyboardInterrupt:
        log("main: user interrupt")

    log("stopping camera")
    cap.stop()

    cv2.destroyAllWindows()

    if opt.is_client:
        log("stopping remote predictor")
        predictor.stop()

    log("main: exit")

async def main():
    async with websockets.serve(run_forever, "localhost", 1243):
        await asyncio.Future()  # run forever

asyncio.run(main())
