import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { WriterItem } from './WriterItem';
import { SolstoryItem } from '@solstory/api';
import {
  useRecoilValue,
} from 'recoil';
import { solstoryProgramAtom } from '../state';


export function WritersTab (props) {
  // props.stories: Metadata[]
  const solstoryProgram = useRecoilValue(solstoryProgramAtom);
  const boom = () => {
    solstoryProgram.server.writer.createWriterMetadata({
      label: "manual creation!",
      description: "new metadata from 'creates a writer metadata account'",
      logo: "www.example.com",
      url: "www.example.com",
      cdn: "",
      metadata: ""
    })
  }

  const boom2 = () => {
    const item:SolstoryItem = {
      verified: {
        data: {
          random: "data",
        }
      },
      next: {
        uri: "fake",
        hash: "faaake",
      }

    }
    solstoryProgram.server.writer.uploadItemBundlr(item);

  }

  return(
    <Grid container direction="row" spacing={2}>
      <Grid item>
        <Box>
        <Button onClick={boom}>Boom</Button>
        <Button onClick={boom2}>Boom2</Button>
        </Box>
      </Grid>
      {props.writers.map((writer, index) => {return (
        <WriterItem key={writer.writerKey} writer={writer} />
      )})}
    </Grid>
  )

}
