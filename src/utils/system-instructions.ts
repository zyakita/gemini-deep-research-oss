import moment from 'moment';

export const currentDateTimePrompt = `Current datetime is: ${moment().format('lll')}`;
export const languageRequirementPrompt = `Respond to the user in the language they used to make the request.`;
