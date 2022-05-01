use anchor_lang::prelude::*;

// call with         Err(MyError::Hello.into())
#[error_code]
pub enum SolstoryError {
    #[msg("This account already exists")] // This might also be other errors, init defaults to 0x0.
    AccountExists = 1,
    #[msg("Stated creator does not have update privileges on the given metadata")]
    InvalidCreatorError = 2,
    #[msg("Incorrect Hashcode")]
    HashMismatchError = 3,
    #[msg("TimestampOutOfRange")]
    TimestampRangeError = 4,
    #[msg("Metaplaex Deserialization Failure")]
    MetaplexDeserializeError = 5,
    #[msg("Invalid Access Type Error")]
    InvalidAccessTypeError = 6,
    #[msg("Visibility Index Access Violation")]
    VisibilityIndexAccessError = 7,
}
