use anchor_lang::prelude::*;

// call with         Err(MyError::Hello.into())
#[error_code]
pub enum SolstoryError {
    #[msg("This account already exists")] // This might also be other errors, init defaults to 0x0.
    AccountExists = 7001,
    #[msg("Stated owner does not have update privileges on the given metadata")]
    InvalidOwnerError = 7002,
    #[msg("Incorrect Hashcode")]
    HashMismatchError = 7003,
    #[msg("TimestampOutOfRange")]
    TimestampRangeError = 7004,
    #[msg("Metaplaex Deserialization Failure")]
    MetaplexDeserializeError = 7005,
    #[msg("Invalid Access Type Error")]
    InvalidAccessTypeError = 7006,
}
