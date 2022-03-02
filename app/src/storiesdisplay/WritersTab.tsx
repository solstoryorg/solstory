import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { WriterItem } from './WriterItem';
import {
  useRecoilValue,
} from 'recoil';
import { solstoryProgramAtom } from '../state';


export function WritersTab (props) {
  // props.stories: Metadata[]
  const solstoryProgram = useRecoilValue(solstoryProgramAtom);
  const boom = () => {
    solstoryProgram.server.createWriterMetadata({
      label: "manual creation!",
      description: "metadata from 'creates a writer metadata account'",
      logo: "www.example.com",
      url: "www.example.com",
      cdn: "",
      metadata: ""
    })
  }

  return(
    <Grid container direction="row" spacing={2}>
      <Grid item>
        <Button onClick={boom}>Boom</Button>
      </Grid>
      {props.writers.map((writer, index) => {return (
        <WriterItem key={writer.writerKey} writer={writer} />
      )})}
    </Grid>
  )

}
