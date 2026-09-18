import zlib
import struct

def make_png(width, height, color_bg, color_fg):
    raw_data = bytearray()
    
    cx = width // 2
    cy = height // 2
    radius = int(width * 0.42)
    radius_inner = int(width * 0.28)

    for y in range(height):
        raw_data.append(0)  # Filter type None
        for x in range(width):
            dx = x - cx
            dy = y - cy
            dist_sq = dx*dx + dy*dy
            
            # Rounded rect background
            corner_r = int(width * 0.2)
            nx = max(abs(dx) - (width//2 - corner_r), 0)
            ny = max(abs(dy) - (height//2 - corner_r), 0)
            in_body = (nx*nx + ny*ny) <= corner_r*corner_r

            if not in_body:
                # Transparent outside rounded rect
                raw_data.extend((0, 0, 0, 0))
            else:
                # Draw a receipt/building styled icon
                # A white document shape in the middle
                doc_w = int(width * 0.25)
                doc_h = int(height * 0.32)
                if abs(dx) < doc_w and abs(dy) < doc_h:
                    # Draw text lines in the document
                    line_y = dy % int(height * 0.08)
                    if line_y < int(height * 0.03) and dy < int(height * 0.2):
                        raw_data.extend((5, 150, 105, 255)) # Dark green line
                    else:
                        raw_data.extend((255, 255, 255, 255)) # White sheet
                else:
                    raw_data.extend(color_bg)

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw_data), 9))
    png += chunk(b'IEND', b'')
    return png

# Generate 192x192 and 512x512 icons
bg_color = (5, 150, 105, 255) # Emerald green
fg_color = (255, 255, 255, 255) # White

with open("public/icon-192.png", "wb") as f:
    f.write(make_png(192, 192, bg_color, fg_color))

with open("public/icon-512.png", "wb") as f:
    f.write(make_png(512, 512, bg_color, fg_color))

with open("public/icon.png", "wb") as f:
    f.write(make_png(512, 512, bg_color, fg_color))

print("Icons created successfully!")
