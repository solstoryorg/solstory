use anchor_lang::prelude::*;

// call with         Err(MyError::Hello.into())
#[error]
pub enum SolstoryError {
    #[msg("This account already exists")] // This might also be other errors, init defaults to 0x0.
    AccountExists = 7001,
    #[msg("Stated owner does not have update privileges on the given metadata")]
    InvalidOwnerError = 7002,
    #[msg("second error")]
    SecondError,
}
