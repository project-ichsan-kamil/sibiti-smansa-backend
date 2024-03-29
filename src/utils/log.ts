export const logErrorMessage = (errorMessage: string): void => {
    const currentDateTime = new Date();
  
    const formattedDate = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(currentDateTime);
  
    const formattedTime = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(currentDateTime);
  
    console.log(`${formattedDate} ${formattedTime} Error: ${errorMessage}`);
  };