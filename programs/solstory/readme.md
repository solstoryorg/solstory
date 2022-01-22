

```
{
prev_uri: #sits outside because data location may change
more_uri: #sits outside because expanded data may change
^^where are these and why are they there?
data: {
title
source

prev_hash:
more_hash:


We can possibly simplify.

hash of all of it
store h({
hash_current_data
hash_previous_set
})

next one is
store h({hash current data
hash previous set == h above
})

must store hash of previous set
to validate
hash together the hash of current data and the previous set hash

if either is wrong mismatch of hash to stored hash

repeat backwards with validated previous set hash

if we can't find at some point then history is borkbork
if we have a mismatch at some point then data is invalid

```
