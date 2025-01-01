from io import BytesIO
import segno


def generate_qr_code(data: str):
    image_buffer = BytesIO()

    qrcode = segno.make_qr(data)
    qrcode.save(
        image_buffer,
        kind="png",
        scale=5,
        border=3,
        # light="cyan",
        # dark="darkblue"
    )

    image_buffer.seek(0)
    return image_buffer
