import os
from PIL import Image, ImageDraw, ImageFont

def patch_image():
    # 1. Load original image
    img_path = 'public/screenshots/tenant_app.jpg'
    im = Image.open(img_path)
    width, height = im.size
    
    # 2. Reconstruct the left gradient to erase old text and duplicate status bar time
    # We will interpolate horizontally from x = 10 to x = 205, for y = 70 to 205
    # (Starting y at 70 preserves the original Gachibowli location bar completely!)
    for y in range(70, 205):
        c_start = im.getpixel((10, y))
        c_end = im.getpixel((205, y))
        for x in range(10, 205):
            t = (x - 10) / (205 - 10)
            r = int(c_start[0] * (1 - t) + c_end[0] * t)
            g = int(c_start[1] * (1 - t) + c_end[1] * t)
            b = int(c_start[2] * (1 - t) + c_end[2] * t)
            im.putpixel((x, y), (r, g, b))
            
    # 3. Clean up duplicate status bar icons on the right (x = 205 to x = 385, y = 144 to y = 163)
    # We use local-contrast vertical neighbor inpainting to clean dark icon pixels
    for y in range(144, 163):
        for x in range(205, 385):
            pixel = im.getpixel((x, y))
            p_up = im.getpixel((x, y - 10))
            p_down = im.getpixel((x, y + 10))
            
            # If the current pixel is darker than both up and down by a margin, it is an icon pixel
            is_dark_icon = True
            for i in range(3):
                avg_val = (p_up[i] + p_down[i]) / 2.0
                if pixel[i] >= avg_val - 12:
                    is_dark_icon = False
                    break
                    
            if is_dark_icon:
                r = int((p_up[0] + p_down[0]) / 2)
                g = int((p_up[1] + p_down[1]) / 2)
                b = int((p_up[2] + p_down[2]) / 2)
                im.putpixel((x, y), (r, g, b))
    
    # 4. Redraw the clean, beautiful, non-overlapping typography in the purple card
    draw = ImageDraw.Draw(im)
    
    # Load fonts
    font_paths = [
        "C:\\Windows\\Fonts\\segoeuib.ttf",  # Segoe UI Bold
        "C:\\Windows\\Fonts\\arialbd.ttf",   # Arial Bold
        "C:\\Windows\\Fonts\\segoeui.ttf",   # Segoe UI Regular
        "C:\\Windows\\Fonts\\arial.ttf"       # Arial Regular
    ]
    
    font_title = None
    font_subtitle = None
    
    for path in font_paths:
        try:
            if os.path.exists(path):
                if 'segoeuib' in path.lower() or 'arialbd' in path.lower():
                    font_title = ImageFont.truetype(path, 21)  # Shrunk from 23 to 21 for safe spacing
                elif 'segoeui' in path.lower() or 'arial' in path.lower():
                    font_subtitle = ImageFont.truetype(path, 10)  # Shrunk from 11 to 10
                
                if font_title and font_subtitle:
                    break
        except Exception:
            pass
            
    if not font_title:
        font_title = ImageFont.load_default()
    if not font_subtitle:
        font_subtitle = ImageFont.load_default()
        
    # Draw the main title "Find Your\nPerfect Space" (compact size, 21px font, well spaced)
    # Shifting vertical positions down: y = 82 and y = 108.
    # This leaves a perfect 22px padding below the location bar (y = 40 to 60).
    draw.text((20, 82), "Find Your", fill=(255, 255, 255), font=font_title)
    draw.text((20, 108), "Perfect Space", fill=(255, 255, 255), font=font_title)
    
    # Draw the subtitle "Hostels, Apartments & Commercial spaces near you"
    # Positioned lower down (y = 158 and y = 173) to prevent building pin overlap.
    draw.text((20, 158), "Hostels, Apartments &", fill=(255, 255, 255, 210), font=font_subtitle)
    draw.text((20, 173), "Commercial spaces near you", fill=(255, 255, 255, 210), font=font_subtitle)
    
    # Save the patched image over the original
    patched_path = 'public/screenshots/tenant_app.jpg'
    im.save(patched_path, quality=95)
    print("Patched image saved successfully!")

if __name__ == '__main__':
    patch_image()
