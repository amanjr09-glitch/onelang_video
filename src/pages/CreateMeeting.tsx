import { EuiCard, EuiFlexGroup, EuiFlexItem, EuiImage } from "@elastic/eui";

import React from "react";
import { useNavigate } from "react-router-dom";
import meeting2 from "../assets/meeting2.png";
import Header from "../components/Header";
import useAuth from "../hooks/useAuth";

export default function CreateMeeting() {
  useAuth();
  const navigate = useNavigate();

  return (  
    <>
      <div
        style={{
          display: "flex",
          height: "100vh",
          flexDirection: "column",
        }}
      >
        <Header />
        <EuiFlexGroup
          justifyContent="center"
          alignItems="center"
          style={{ margin: "5vh 10vw" }}
        >
          <EuiFlexItem>
            <EuiCard
              icon={<EuiImage src={meeting2} alt="icon" size="100%" />}
              title={`Create Video Conference`}
              description="Invite multiple persons to the meeting."
              onClick={() => navigate("/videoconference")}
              paddingSize="xl"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </>
  );
}
