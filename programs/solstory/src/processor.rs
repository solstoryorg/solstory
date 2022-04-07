use anchor_lang::prelude::*;
use crate::{ExtAppendData, TIMESTAMP_ACCEPTABLE_VARIANCE};
use crate::state::*;
use crate::utils::*;
use crate::error::*;


pub fn init_writer_account(writer_head_pda: &mut Account<WriterHead>, authorized:bool) -> Result <()>{
    writer_head_pda.authorized = authorized;
    writer_head_pda.visibility_index = 0;
    writer_head_pda.access_type = AccessType::None;

    // (*ctx.accounts.writer_pda).uri =  String::new();
    writer_head_pda.obj_id =  [0; 32];
    writer_head_pda.current_hash =  [0; 32];

    Ok(())
}


/**
 * This function validates:
 *
 * caculated new hash is equal to claimed new hash
 *
 * new hash is the timestamp, the data hash, and the current hash
 * we validated timestamp and current, and data is up to the user.
 *
 * claimed timestamp iw within TIMESTAMP_ACCEPTABLE_VARIANCE of current block time
 * claimed current hash is equal to the current hash
 * claimed access type is not none
 */
pub fn append_data_to_writer(writer_head_pda: &mut Account<WriterHead>, data: ExtAppendData) -> Result<()> {
    let hash = hash_from_prev(data.timestamp, data.data_hash, data.current_hash);
    msg!("hash: {:?}", hash);
    if hash != data.new_hash {
        return Err(SolstoryError::HashMismatchError.into())
    }

    let cur_time:i64 = (Clock::get()?).unix_timestamp;

    //TODO: explore how tight we can get this.
    // As mentioned above, this should be treated as a santiy check more than anything
    if (data.timestamp-cur_time).abs() > TIMESTAMP_ACCEPTABLE_VARIANCE {
        return Err(SolstoryError::TimestampRangeError.into())
    }

    if data.current_hash != writer_head_pda.current_hash {
        return Err(SolstoryError::HashMismatchError.into())
    }

    if matches!(data.access_type, AccessType::None) {
        return Err(SolstoryError::InvalidAccessTypeError.into())
    }

    // (*ctx.accounts.writer_head_pda).uri =  data.uri;
    writer_head_pda.current_hash =  hash;
    writer_head_pda.access_type =  data.access_type;
    writer_head_pda.obj_id =  data.obj_id;


    Ok(())
}
