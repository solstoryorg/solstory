import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { useState, useEffect, useMemo } from 'react';
import {
  useRecoilValue,
} from 'recoil';
import { solstoryProgramAtom } from '../state';

export function WriterItem (props) {
  let [popdown, setPopdown] = useState(false);
  let [loaded, setLoaded] = useState(false);
  let [extendedMetadata, setExtendedMetadata] = useState("Loading Extended Metadata");
  const solstoryProgram = useRecoilValue(solstoryProgramAtom);

  useEffect(() => {
    if (loaded) {
      solstoryProgram.client.getExtendedMetadata(props.writer.writer_key)
        .then((metadata) => {
          setExtendedMetadata(metadata);
        });
    }
  }, [props.writer.writer_key, loaded, solstoryProgram])



  const displayExtra = () => {
    if(!popdown){
      return;
    }
    //if we've never loaded before set it to true and trigger loading
    if(!loaded){
      setLoaded(true);
    }
    // We use subtitle2 here because we're too lazy to do the typescript work
    // for an independent variant.
    return (
      <Box sx={{}}>
        <Typography variant="code">
          {JSON.stringify(extendedMetadata, null, 2)}
        </Typography>
      </Box>

    );
  }

  return (
    <Grid item key={props.writer.writer_key} xs={12} sm={6} md={4} sx={{
      }}>
      <Box>
        <Paper sx={{display: 'flex', aspectRatio: 1.0, height:1.0, cursor: "pointer"}} title={props.writer.label} onClick={(e)=>{setPopdown(!popdown)}}>
          <Box sx={{display: 'inline-flex', maxWidth:0.3, m:1}} component="img" src={props.writer.logo}/>
        <Box sx={{display: 'inline-flex', flexDirection:"column", maxWidth:0.7, m:1}}>
        <Typography variant="h6">{props.writer.label}</Typography>
            <Link href={props.writer.url} variant="subtitle1">Website</Link>
        <Typography variant="body1">{props.writer.description}</Typography>
          {displayExtra()}
          </Box>



        </Paper>
  </Box>
    </Grid>
  )

}
