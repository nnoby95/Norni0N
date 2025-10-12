#!/usr/bin/env python3
"""
Simple script to create basic PNG icons for the Chrome extension
"""

from PIL import Image, ImageDraw
import os

def create_icon(size, filename):
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a simple robot icon
    # Background circle
    margin = size // 8
    draw.ellipse([margin, margin, size-margin, size-margin], 
                fill=(102, 126, 234, 255), outline=(255, 255, 255, 255), width=2)
    
    # Robot body
    body_margin = size // 4
    body_size = size // 2
    draw.rectangle([body_margin, body_margin, body_margin + body_size, body_margin + body_size],
                  fill=(255, 255, 255, 230), outline=(102, 126, 234, 255), width=1)
    
    # Eyes
    eye_size = size // 12
    eye_y = body_margin + size // 6
    left_eye_x = body_margin + size // 6
    right_eye_x = body_margin + size // 2
    
    draw.ellipse([left_eye_x - eye_size//2, eye_y - eye_size//2, 
                  left_eye_x + eye_size//2, eye_y + eye_size//2],
                fill=(102, 126, 234, 255))
    draw.ellipse([right_eye_x - eye_size//2, eye_y - eye_size//2, 
                  right_eye_x + eye_size//2, eye_y + eye_size//2],
                fill=(102, 126, 234, 255))
    
    # Mouth
    mouth_y = body_margin + size // 2
    mouth_width = size // 4
    mouth_x = body_margin + size // 4
    draw.rectangle([mouth_x, mouth_y, mouth_x + mouth_width, mouth_y + size // 20],
                  fill=(102, 126, 234, 255))
    
    # Checkmark
    check_x = size - size // 4
    check_y = size - size // 4
    check_size = size // 6
    draw.line([check_x - check_size//2, check_y, check_x, check_y + check_size//2], 
             fill=(76, 175, 80, 255), width=3)
    draw.line([check_x, check_y + check_size//2, check_x + check_size//2, check_y - check_size//2], 
             fill=(76, 175, 80, 255), width=3)
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def main():
    # Create icons directory if it doesn't exist
    os.makedirs('icons', exist_ok=True)
    
    # Create different sized icons
    create_icon(16, 'icons/icon16.png')
    create_icon(48, 'icons/icon48.png')
    create_icon(128, 'icons/icon128.png')
    
    print("All icons created successfully!")

if __name__ == '__main__':
    main()
