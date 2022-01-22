use anchor_lang::prelude::*;

// call with         Err(MyError::Hello.into())
#[error]
pub enum MyError {
    #[msg("This account already exists")] // This might also be other errors, init defaults to 0x0.
    AccountExists = 200,
    #[msg("This is an error message clients will automatically display")]
    Hello,
    #[msg("second error")]
    SecondError,
}
