import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import {
  selector,
  useSetRecoilState,
  useRecoilValue,
} from 'recoil';

import { WalletBrowser } from './storiesdisplay';
import { WritersTab } from './storiesdisplay';
import { solstoryProgramAtom } from './state';


export function TabContainer (props) {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [writers, setWriters] = useState([]);
  const solstoryProgram = useRecoilValue(solstoryProgramAtom);

  useEffect(() => {
    console.log("ATTEMPTED EFFECT USE");
    if (solstoryProgram != undefined) {
      console.log("SUCCESSFUL EFFECT USE");
      setLoading(true);
      solstoryProgram.client.getAllMetadata()
      .then((blah)=>{
        console.log("output", blah)
        setWriters(blah);
        setLoading(false);
      });
    }
  },[solstoryProgram]);

  const handleTabClick = (e: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);

  }
  const TabPanel = (props) => {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );

  }

  return (
    <Box>
      <Tabs value={tabValue} onChange={handleTabClick}>
        <Tab label="Wallet Browser" />
        <Tab label="Writer Program Browser" />
      </Tabs>
      <TabPanel value={tabValue} index = {0}>

        <WalletBrowser/>
      </TabPanel>
      <TabPanel value={tabValue} index = {1}>
        <WritersTab loading={loading} writers={writers}/>
      </TabPanel>

    </Box>
  )

}
