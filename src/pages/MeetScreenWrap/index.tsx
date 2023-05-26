import { EuiCard, EuiFlexGrid, EuiFlexItem } from '@elastic/eui';
import "./index.css"
import MeetFooter from './MeetFooter';
import { useAppSelector } from '../../app/hooks';

const MeetScreenWrap = () => {
    const { participants } = useAppSelector(state => state.meetings);
    return (
        <div className='wrapper'>
            <EuiFlexGrid
                gutterSize="l"
                className='streams'
                columns={3}
                direction="row">{Object.keys(participants).map((key) => {
                    return (
                        <EuiFlexItem key={key} className='item-card'>
                            <EuiCard
                                title={`${participants[key].fullName} ${participants[key].currentUser ? "(You)" : ""}`}
                                onClick={() => { }}
                            >
                                <video className='streamVideo' autoPlay playsInline muted></video>
                                {!participants[key].preferences.audio && "muted"}
                                {!participants[key].preferences.screen && "Screen Share"}
                            </EuiCard>
                        </EuiFlexItem>
                    )
                })}</EuiFlexGrid>
            <MeetFooter />
        </div>
    );
};

export default MeetScreenWrap;
