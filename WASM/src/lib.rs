#![no_std]

#[panic_handler]
fn handle_panic(_: &core::panic::PanicInfo) -> ! {
    loop {}
}

const MAX_SIZE: usize = 3_000 * 3_000;

#[no_mangle]
static mut BUFFER: [u8; MAX_SIZE] = [0; MAX_SIZE];
static mut SECOND_BAND: [u8; MAX_SIZE] = [0; MAX_SIZE];

#[no_mangle]
pub extern "C" fn get_max_size() -> usize {
    MAX_SIZE as usize
}

#[no_mangle]
pub unsafe extern "C" fn box_blur(width: u32, height: u32, radius: u32) {
    for h in 0..height {
        let mut sum: u32 = 0;
        let mut cell_count: u32 = radius + 1;

        for j in 0..(radius + 1) {
            sum += BUFFER[(width * h + j) as usize] as u32;
        }

        SECOND_BAND[(width * h) as usize] = (sum / cell_count) as u8;

        for w in 1..width {
            if w > radius {
                sum -= BUFFER[(width * h + w - radius - 1) as usize] as u32;
                cell_count -= 1;
            }
            if w < width - radius {
                sum += BUFFER[(width * h + w + radius) as usize] as u32;
                cell_count += 1;
            }
            SECOND_BAND[(width * h + w) as usize] = (sum / cell_count) as u8;
        }
    }

    for w in 0..width {
        let mut sum: u32 = 0;
        let mut cell_count: u32 = radius + 1;

        for j in 0..(radius + 1) {
            sum += SECOND_BAND[(w + j * width) as usize] as u32;
        }

        BUFFER[w as usize] = (sum / cell_count) as u8;

        for h in 1..height {
            if h > radius {
                sum -= SECOND_BAND[(w + width * (h - radius - 1)) as usize] as u32;
                cell_count -= 1;
            }
            if h < height - radius {
                sum += SECOND_BAND[(w + width * (h + radius)) as usize] as u32;
                cell_count += 1;
            }
            BUFFER[(width * h + w) as usize] = (sum / cell_count) as u8;
        }
    }
}

#[no_mangle]
pub unsafe extern "C" fn stack_blur(width: u32, height: u32, radius: u32) {
    const MUL_TABLE: [u16; 256] = [
        512, 512, 512, 456, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512, 454, 405,
        364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512, 482, 454, 428, 405,
        383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456, 437, 420, 404, 388, 374, 360,
        347, 335, 323, 312, 302, 292, 282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405,
        394, 383, 373, 364, 354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259,
        507, 496, 485, 475, 465, 456, 446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360,
        354, 347, 341, 335, 329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265,
        261, 512, 505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405,
        399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328, 324, 320,
        316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271, 268, 265, 262, 259,
        257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456, 451, 446, 442, 437, 433, 428,
        424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385, 381, 377, 374, 370, 367, 363, 360,
        357, 354, 350, 347, 344, 341, 338, 335, 332, 329, 326, 323, 320, 318, 315, 312, 310, 307,
        304, 302, 299, 297, 294, 292, 289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265,
        263, 261, 259, 257,
    ];

    const SHG_TABLE: [u8; 256] = [
        9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 18,
        18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20,
        20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21,
        21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22,
        22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
        22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
        23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
        23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24,
        24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
        24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
        24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
        24, 24, 24,
    ];

    let mul_sum = MUL_TABLE[radius as usize] as u32;
    let shg_sum = SHG_TABLE[radius as usize] as u32;

    for h in 0..height {
        let mut sum: u32 = 0;
        let mut incoming_items: u32 = BUFFER[(width * h) as usize] as u32;
        let mut outgoing_items: u32 = BUFFER[(width * h) as usize] as u32 * (radius + 1);

        for j in 1..(radius + 2) {
            sum += BUFFER[(width * h) as usize] as u32 * j;
        }

        for j in 1..(radius + 1) {
            incoming_items += BUFFER[(width * h + j) as usize] as u32;
            sum += (BUFFER[(width * h + j) as usize] as u32 * (radius - j + 1)) as u32;
        }

        SECOND_BAND[(width * h) as usize] = (sum * mul_sum >> shg_sum) as u8;

        for w in 1..width {
            let current_pos = width * h + w;
            if w > radius + 1 {
                outgoing_items -= BUFFER[(current_pos - radius - 2) as usize] as u32;
            } else {
                outgoing_items -= BUFFER[(width * h) as usize] as u32;
            }

            if w < width - radius {
                incoming_items += BUFFER[(current_pos + radius) as usize] as u32;
            } else {
                incoming_items += BUFFER[(width * h + width - 1) as usize] as u32;
            }

            outgoing_items += BUFFER[(current_pos - 1) as usize] as u32;
            incoming_items -= BUFFER[(current_pos - 1) as usize] as u32;
            sum += incoming_items - outgoing_items;
            SECOND_BAND[(current_pos) as usize] = (sum * mul_sum >> shg_sum) as u8;
        }
    }

    for w in 0..width {
        let mut sum: u32 = 0;
        let mut incoming_items: u32 = SECOND_BAND[w as usize] as u32;
        let mut outgoing_items: u32 = SECOND_BAND[w as usize] as u32 * (radius + 1);

        for j in 1..(radius + 2) {
            sum += SECOND_BAND[w as usize] as u32 * j;
        }

        for j in 1..(radius + 1) {
            incoming_items += SECOND_BAND[(w + j * width) as usize] as u32;
            sum += (SECOND_BAND[(w + j * width) as usize] as u32 * (radius - j + 1)) as u32;
        }

        BUFFER[w as usize] = ((sum * mul_sum) >> shg_sum) as u8;

        for h in 1..height {
            if h > radius + 1 {
                outgoing_items -= SECOND_BAND[(w + width * (h - radius - 2)) as usize] as u32;
            } else {
                outgoing_items -= SECOND_BAND[w as usize] as u32;
            }
            if h < height - radius {
                incoming_items += SECOND_BAND[(w + width * (h + radius)) as usize] as u32;
            } else {
                incoming_items += SECOND_BAND[(w + width * (height - 1)) as usize] as u32;
            }

            outgoing_items += SECOND_BAND[(w + width * (h - 1)) as usize] as u32;
            incoming_items -= SECOND_BAND[(w + width * (h - 1)) as usize] as u32;
            sum += incoming_items - outgoing_items;

            BUFFER[(w + width * h) as usize] = ((sum * mul_sum) >> shg_sum) as u8;
        }
    }
}
