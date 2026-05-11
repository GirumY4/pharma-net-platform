// src/features/orders/components/StatusStepper.tsx
import { Box, Step, StepLabel, Stepper, Typography } from "@mui/material";
import { STATUS_CONFIG } from "../constants";
import type { OrderStatus } from "../types";

interface StatusStepperProps {
  currentStatus: OrderStatus;
}

const ORDER_LIFECYCLE: OrderStatus[] = [
  "pending",
  "approved",
  "processing",
  "ready",
  "delivered",
];

export const StatusStepper = ({ currentStatus }: StatusStepperProps) => {
  const activeStep = ORDER_LIFECYCLE.indexOf(currentStatus);
  const rejected = currentStatus === "rejected";

  return (
    <Box sx={{ width: "100%", py: 2 }}>
      <Stepper
        activeStep={rejected ? -1 : activeStep}
        alternativeLabel
        sx={{
          "& .MuiStepConnector-root": {
            top: 8,
            "& .MuiStepConnector-line": {
              borderColor: "rgba(23, 35, 31, 0.2)",
              borderTopWidth: 2,
            },
            "&.Mui-active, &.Mui-completed": {
              "& .MuiStepConnector-line": {
                borderColor: "#0F8B6C",
              },
            },
          },
          "& .MuiStepLabel-label": {
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "text.secondary",
          },
          "& .MuiStepIcon-root": {
            color: "rgba(23, 35, 31, 0.3)",
            fontSize: "1.5rem",
            "&.Mui-active, &.Mui-completed": {
              color: "#0F8B6C",
            },
          },
        }}
      >
        {ORDER_LIFECYCLE.map((step) => {
          const config = STATUS_CONFIG[step];
          const isCompleted = ORDER_LIFECYCLE.indexOf(step) < activeStep;
          const isCurrent = step === currentStatus;

          return (
            <Step key={step}>
              <StepLabel
                icon={
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: isCompleted
                        ? "#0F8B6C"
                        : isCurrent
                          ? "#DDAA4A"
                          : "rgba(23, 35, 31, 0.1)",
                      color:
                        isCompleted || isCurrent ? "white" : "text.secondary",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                    }}
                  >
                    {config.icon}
                  </Box>
                }
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: isCompleted
                      ? "#0F8B6C"
                      : isCurrent
                        ? "#DDAA4A"
                        : "text.secondary",
                    fontWeight: isCurrent ? 700 : 500,
                  }}
                >
                  {config.label}
                </Typography>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>

      {rejected && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: "#FEE2E2",
            borderRadius: 2,
            border: "1px solid #FCA5A5",
          }}
        >
          <Typography variant="body2" color="#DC2626" sx={{ fontWeight: 600 }}>
            ❌ Order Rejected
          </Typography>
        </Box>
      )}
    </Box>
  );
};
