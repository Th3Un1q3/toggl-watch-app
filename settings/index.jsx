import APIToken from './APIToken';
import { API_TOKEN_SETTINGS_STORAGE_KEY } from '../common/constants';

const ApplicationConfiguration = (props) => <Section
  title={<Text bold align="center">Configure your app</Text>}>
</Section>;

const mySettings = (props) => {
  const availableSections = props.settings[API_TOKEN_SETTINGS_STORAGE_KEY] ? [
    ApplicationConfiguration,
    APIToken
  ] : [
    APIToken,
  ];

  return (
    <Page>
      {availableSections.map(S => <S {...props}/>)}
    </Page>
  );
};

registerSettingsPage(mySettings);
