import os
from PIL import Image, ImageDraw, ImageFont

def patch_image_v2():
    img_path = 'public/screenshots/tenant_app.jpg'
    im = Image.open(img_path)
    width, height = im.size
    
    # 1. Crop original location pin and bell icons from the screenshot
    # These coordinates are checked from the grid debug image.
    pin_icon = im.crop((16, 40, 36, 62))   # size: 20x22
    bell_icon = im.crop((358, 39, 385, 65)) # size: 27x26
    
    # 2. Reconstruct the left gradient background to erase all old text, icons, and duplicate status bar
    # We interpolate horizontally from x = 10 to x = 205, for y = 40 to 205.
    # This completely clears the original location bar and text area, leaving a clean sky canvas.
    for y in range(40, 205):
        c_start = im.getpixel((10, y))
        c_end = im.getpixel((205, y))
        for x in range(10, 205):
            t = (x - 10) / (205 - 10)
            r = int(c_start[0] * (1 - t) + c_end[0] * t)
            g = int(c_start[1] * (1 - t) + c_end[1] * t)
            b = int(c_start[2] * (1 - t) + c_end[2] * t)
            im.putpixel((x, y), (r, g, b))
            
    # 3. Clean up the duplicate status bar icons on the right (x = 205 to x = 385, y = 144 to y = 163)
    for y in range(144, 163):
        for x in range(205, 385):
            pixel = im.getpixel((x, y))
            p_up = im.getpixel((x, y - 10))
            p_down = im.getpixel((x, y + 10))
            
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
                
    # 4. Paste the location pin and bell icons back at their new, perfectly-spaced vertical coordinates
    # We place the location pin at x = 16, y = 52 (center aligned vertically)
    # We place the bell icon at x = 358, y = 50 (matching the pin's center vertical alignment)
    im.paste(pin_icon, (16, 52))
    im.paste(bell_icon, (358, 50))
    
    # 5. Redraw the clean, beautifully spaced typography using modern spacing
    draw = ImageDraw.Draw(im)
    
    font_paths = [
        "C:\\Windows\\Fonts\\segoeuib.ttf",  # Segoe UI Bold
        "C:\\Windows\\Fonts\\arialbd.ttf",   # Arial Bold
        "C:\\Windows\\Fonts\\segoeui.ttf",   # Segoe UI Regular
        "C:\\Windows\\Fonts\\arial.ttf"       # Arial Regular
    ]
    
    font_title = None
    font_subtitle = None
    font_location = None
    
    for path in font_paths:
        try:
            if os.path.exists(path):
                if 'segoeuib' in path.lower() or 'arialbd' in path.lower():
                    font_title = ImageFont.truetype(path, 19)       # Clean title size (19px)
                    font_location = ImageFont.truetype(path, 9.5)   # Location bar bold font
                elif 'segoeui' in path.lower() or 'arial' in path.lower():
                    font_subtitle = ImageFont.truetype(path, 9.5)    # Clean subtitle size (9.5px)
                
                if font_title and font_subtitle and font_location:
                    break
        except Exception:
            pass
            
    if not font_title:
        font_title = ImageFont.load_default()
    if not font_subtitle:
        font_subtitle = ImageFont.load_default()
    if not font_location:
        font_location = ImageFont.load_default()
        
    # Draw location text next to the pin icon: x = 34, y = 57.
    # This aligns the text perfectly in a dedicated line next to the pin icon.
    draw.text((34, 57), "Gachibowli, Hyderabad", fill=(255, 255, 255, 240), font=font_location)
    
    # Draw the heading "Find Your Perfect Space" in 2 lines below the location bar
    # Positioned lower down (y = 85 and y = 108) with clean margins.
    draw.text((20, 85), "Find Your", fill=(255, 255, 255), font=font_title)
    draw.text((20, 108), "Perfect Space", fill=(255, 255, 255), font=font_title)
    
    # Draw the subtitle "Hostels, Apartments & Commercial spaces near you"
    # Positioned lower down (y = 150 and y = 165) with safe boundaries and perfect spacing.
    draw.text((20, 150), "Hostels, Apartments &", fill=(255, 255, 255, 210), font=font_subtitle)
    draw.text((20, 165), "Commercial spaces near you", fill=(255, 255, 255, 210), font=font_subtitle)
    
    # Save the patched image over the original
    patched_path = 'public/screenshots/tenant_app.jpg'
    im.save(patched_path, quality=95)
    print("Patched image (v2) saved successfully!")

if __name__ == '__main__':
    patch_image_v2()
