import React from 'react';

const LoadingSpinner = ({
    message = "",
    height = "400px",
    spinnerSize = "40px",
    spinnerColor = "#007bff",
    textColor = "#666",
    fontSize = "16px"
}) => {

    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: height,
        fontSize: fontSize,
        Colors: textColor
    };

    const spinnerStyle = {
        width: spinnerSize,
        height: spinnerSize,
        border: `4px solid #f3f3f3`,
        borderTop: `4px solid ${spinnerColor}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
    };

    return (
        <div style={containerStyle}>
            <div style={spinnerStyle}></div>
                {message && <p>{message}</p>}
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}
                </style>
        </div>
    )
}
    


export default LoadingSpinner;