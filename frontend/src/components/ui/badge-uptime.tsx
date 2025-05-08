import { Badge } from "@mui/material";
import React from "react";

type BadgeUptimeProps = {
  uptime: "on" | "off" | undefined;
  children?: React.ReactNode;
};

export const BadgeUptime: React.FC<BadgeUptimeProps> = ({
  uptime,
  children,
}) => {
  return (
    <Badge
      variant="dot"
      color={uptime === "on" ? "success" : "error"}
      invisible={!uptime}
      slotProps={{
        badge: {
          style: {
            animationName: "uptime",
            animationDuration: "8s",
            animationIterationCount: "infinite",
            animationTimingFunction: "step-end",
          },
        },
      }}
    >
      <style>
        {`
        @keyframes uptime {
            from {
                opacity: 1;
            }

            95% {
                opacity: 0.5;
            }
            
            to {
                opacity: 1;
            }
        }
        `}
      </style>

      {children}
    </Badge>
  );
};
