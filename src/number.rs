use std::{fmt, num::NonZeroU16};

/// A number between 1 and 9.
///
/// This is represented as a power of 2, to make conversions between
/// [Field](super::Field) and Number easier.
#[repr(transparent)]
#[derive(Clone, Copy, PartialEq, Eq)]
pub struct Number(NonZeroU16);

impl Number {
    pub const N1: Number = Number::new(1);
    pub const N2: Number = Number::new(2);
    pub const N3: Number = Number::new(3);
    pub const N4: Number = Number::new(4);
    pub const N5: Number = Number::new(5);
    pub const N6: Number = Number::new(6);
    pub const N7: Number = Number::new(7);
    pub const N8: Number = Number::new(8);
    pub const N9: Number = Number::new(9);

    /// Creates a number. Panics if `n` is not between 1 and 9.
    pub const fn new(n: u8) -> Self {
        if n == 0 || n > 9 {
            panic!("Invalid number");
        }
        Number(NonZeroU16::new(1 << (n - 1)).unwrap())
    }

    /// Returns the [Number] equivalent to the least significant bit in `n`.
    ///
    /// Example: With `n = 0b101000`, the least significant bit is `0b1000`,
    /// the 4th bit from the right. Therefore, this returns the number 4.
    pub(crate) const fn from_smallest_bit(n: u16) -> Option<Self> {
        if n == 0 {
            return None;
        }

        let mut i = 1;
        while n & !i == n {
            i <<= 1;
        }
        if i > Self::N9.as_bit() {
            return None;
        }

        Some(Number(NonZeroU16::new(i).unwrap()))
    }

    /// Returns the bit pattern contained in this number
    #[inline(always)]
    pub(crate) const fn as_bit(self) -> u16 {
        self.0.get()
    }

    /// Returns the number as a `u8`.
    pub fn as_u8(self) -> u8 {
        static BIT_LUT: [u8; 257] = {
            let mut lut = [0; 257];
            lut[1] = 1;
            lut[2] = 2;
            lut[4] = 3;
            lut[8] = 4;
            lut[16] = 5;
            lut[32] = 6;
            lut[64] = 7;
            lut[128] = 8;
            lut[256] = 9;
            lut
        };

        unsafe { *BIT_LUT.get_unchecked(u16::from(self.0) as usize) }
    }

    /// Returns the number formatted as a `&'static string`.
    pub fn as_str(self) -> &'static str {
        static BIT_LUT: [&str; 257] = {
            let mut lut = [""; 257];
            lut[1] = "1";
            lut[2] = "2";
            lut[4] = "3";
            lut[8] = "4";
            lut[16] = "5";
            lut[32] = "6";
            lut[64] = "7";
            lut[128] = "8";
            lut[256] = "9";
            lut
        };

        unsafe { BIT_LUT.get_unchecked(u16::from(self.0) as usize) }
    }

    /// Returns the number as a `&'static string` formatted using small digits.
    pub fn as_str_small(self) -> &'static str {
        static BIT_LUT: [&str; 257] = {
            let mut lut = [""; 257];
            lut[1] = "¹";
            lut[2] = "²";
            lut[4] = "³";
            lut[8] = "⁴";
            lut[16] = "⁵";
            lut[32] = "⁶";
            lut[64] = "⁷";
            lut[128] = "⁸";
            lut[256] = "⁹";
            lut
        };

        unsafe { BIT_LUT.get_unchecked(u16::from(self.0) as usize) }
    }
}

impl fmt::Debug for Number {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.as_u8().fmt(f)
    }
}

pub(crate) static ALL: [Number; 9] = [
    Number::N1,
    Number::N2,
    Number::N3,
    Number::N4,
    Number::N5,
    Number::N6,
    Number::N7,
    Number::N8,
    Number::N9,
];
