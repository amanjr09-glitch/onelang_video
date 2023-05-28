import { EuiCard, EuiFlexGrid, EuiFlexItem } from '@elastic/eui';
import "./index.css"
import MeetFooter from './MeetFooter';
import { StreamContext } from '../StreamContext';
import { useContext, useEffect, useRef } from 'react';

const SingleVideoLog = ({ partcipant }: any) => {
    const videoRef = useRef<any>(null);
    const { localStream } = useContext(StreamContext);
    useEffect(() => {
        const remoteStream = new MediaStream();
        if (partcipant.peerConnection) {
            partcipant.peerConnection.ontrack = (event: any) => {
                event.streams[0].getTracks().forEach((track: any) => {
                    remoteStream.addTrack(track);
                })
                if (!videoRef) {
                    /* @ts-ignore */
                    videoRef.current.srcObj = remoteStream
                }
            }
        }
    }, [partcipant.peerConnection])

    useEffect(() => {
        if (localStream && partcipant.currentUser) {
            videoRef.current.srcObject = localStream;
        }
    }, [partcipant.currentUser, localStream])
    return (
        <EuiFlexItem className='item-card'>
            {/* @ts-ignore */}
            < EuiCard title={`${partcipant.fullName} ${partcipant.currentUser ? "(You)" : ""}`
            }
                onClick={() => { }}
            >
                <video ref={videoRef} className='streamVideo' autoPlay playsInline muted></video>
                {/* @ts-ignore */}
                {!partcipant?.preferences.audio && "muted"}
                {/* @ts-ignore */}
                {!partcipant?.preferences.screen && "Screen Share"}
            </EuiCard >
        </EuiFlexItem >
    )
}

const MeetScreenWrap = () => {
    const { participants } = useContext(StreamContext);
    return (
        <div className='wrapper'>
            <EuiFlexGrid
                gutterSize="l"
                className='streams'
                columns={3}
                direction="row">
                {Object.keys(participants || {}).map((key) => (
                    /* @ts-ignore */
                    < SingleVideoLog key={key} partcipant={participants[key]} />
                ))}
            </EuiFlexGrid>
            <MeetFooter />
        </div>
    );
};

export default MeetScreenWrap;
