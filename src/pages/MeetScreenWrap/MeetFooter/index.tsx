import "./index.css";
import { EuiButton, EuiFlexGroup, EuiFlexItem, EuiIcon } from '@elastic/eui';

const MeetFooter = () => {
    return (
        <EuiFlexGroup
            gutterSize="s"
            alignItems="center"
            responsive={false}
            className='footer'
            wrap
        >
            <EuiFlexItem grow={true}>
                <EuiButton
                    color="danger"
                    onClick={() => { }}
                >
                    <EuiIcon type="exit" />
                    Exit
                </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={true}>
                <EuiButton
                    color="text"
                    onClick={() => { }}
                >
                    Camera
                </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={true}>
                <EuiButton
                    color="text"
                    onClick={() => { }}
                >
                    Microphone
                </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={true}>
                <EuiButton
                    color="text"
                    onClick={() => { }}
                >
                    <EuiIcon type="desktop" />
                    Share Screen
                </EuiButton>
            </EuiFlexItem>
        </EuiFlexGroup>
    );
};

export default MeetFooter;
