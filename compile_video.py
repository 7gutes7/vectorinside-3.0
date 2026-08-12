import os
import glob
import cv2

def main():
    frame_dir = os.path.join(os.path.dirname(__file__), "prism_frames")
    frames = sorted(glob.glob(os.path.join(frame_dir, "frame_*.png")))
    
    if not frames:
        print("Error: No frames found in prism_frames directory!")
        return

    print(f"Compiling {len(frames)} frames into 16:9 MP4 video...")
    
    output_filename = os.path.join(os.path.dirname(__file__), "prism_effect.mp4")
    output_alt = os.path.join(os.path.dirname(__file__), "prism.mp4")

    # Read first frame for dimensions
    first_frame = cv2.imread(frames[0])
    height, width, layers = first_frame.shape
    fps = 30

    print(f"Video resolution: {width}x{height} (16:9), FPS: {fps}")

    # Use mp4v fourcc codec for MP4 video container
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_filename, fourcc, fps, (width, height))

    for idx, fpath in enumerate(frames):
        img = cv2.imread(fpath)
        out.write(img)

    out.release()
    print(f"Successfully generated 5-second 16:9 video: {output_filename}")

    # Also save as prism.mp4
    import shutil
    shutil.copyfile(output_filename, output_alt)
    print(f"Saved copy to: {output_alt}")

if __name__ == "__main__":
    main()
