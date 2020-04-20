import { validateToken } from '../common/api-token-validator';
import { API_TOKEN_SETTINGS_STORAGE_KEY } from '../common/constants';

const HelpSection = () => <Text>
  Go to <Text bold>profile > Profile settings > API Token</Text>.
  Also you can find your API Token on page <Link source="https://toggl.com/app/profile">toggl.com/app/profile</Link>.
</Text>;

const ExplanationSection = () => <Section>
  <Text bold align="center">Privacy</Text>
  <Text italic>
    We store your API token only on your device and only communicate with official Toggl API using encrypted connection.
  </Text>
</Section>;

const APITokenSettings = ({settingsStorage, settings}) => {
  const applyAPIToken = (token) => {
    if (validateToken(token)) {
      settingsStorage.setItem(API_TOKEN_SETTINGS_STORAGE_KEY, token);
    } else {
      settingsStorage.removeItem(API_TOKEN_SETTINGS_STORAGE_KEY);
    }
  };

  const actionLabel = settings[API_TOKEN_SETTINGS_STORAGE_KEY] ?  'Change API Token' : 'Enter your API Token';

  return <Section
    title={<Text bold align="center">API configuration</Text>}>
    <TextInput
      placeholder="API Token"
      label={actionLabel}
      title={actionLabel}
      value={settings[API_TOKEN_SETTINGS_STORAGE_KEY]}
      onChange={value => applyAPIToken(value.name)}
    />
    <HelpSection/>
    <ExplanationSection/>
  </Section>;
};

export default APITokenSettings;
