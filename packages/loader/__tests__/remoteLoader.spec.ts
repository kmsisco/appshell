/** @jest-environment jsdom */
import { AppshellManifest } from '@appshell/config';
import * as fetchDynamicScript from '../src/fetchDynamicScript';
import * as loadFederatedComponent from '../src/loadFederatedComponent';
import remoteLoader from '../src/remoteLoader';

jest.mock('../src/fetchDynamicScript');
jest.mock('../src/loadFederatedComponent');

describe('remoteLoader', () => {
  const manifest: AppshellManifest = {
    remotes: {
      'TestModule/TestComponent': {
        id: 'test-component',
        scope: 'TestModule',
        module: './TestComponent',
        url: 'http://test.com/remoteEntry.js',
        metadata: {},
      },
    },
    modules: {},
  };

  it('should return the federated component if it is found in the manifest', async () => {
    const ExpectedComponent = () => 'test component';
    jest.spyOn(fetchDynamicScript, 'default').mockReturnValueOnce(Promise.resolve(true));
    jest
      .spyOn(loadFederatedComponent, 'default')
      .mockResolvedValue(Promise.resolve(ExpectedComponent));

    const loadRemote = remoteLoader(manifest);
    const ActualComponent = await loadRemote('TestModule/TestComponent');

    expect(ActualComponent).toEqual(ExpectedComponent);
  });

  it('should not fetch remote entry more than once', async () => {
    const ExpectedComponent = () => 'test component';
    const fetchDynamicScriptSpy = jest
      .spyOn(fetchDynamicScript, 'default')
      .mockReturnValueOnce(Promise.resolve(true));
    jest
      .spyOn(loadFederatedComponent, 'default')
      .mockResolvedValue(Promise.resolve(ExpectedComponent));

    const loadRemote = remoteLoader(manifest);

    await loadRemote('TestModule/TestComponent');
    await loadRemote('TestModule/TestComponent');
    await loadRemote('TestModule/TestComponent');

    expect(fetchDynamicScriptSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw if remote key is not found in the manifest', async () => {
    const ExpectedComponent = () => 'test component';
    jest.spyOn(loadFederatedComponent, 'default').mockResolvedValue(ExpectedComponent);

    const loadRemote = remoteLoader(manifest);

    await expect(loadRemote('TestModule/DoesNotExist')).rejects.toThrow(
      /Remote resource not found in manifest/i,
    );
  });

  it('should throw if load federated component fails', async () => {
    jest.spyOn(loadFederatedComponent, 'default').mockRejectedValue(new Error('failed'));

    const loadRemote = remoteLoader(manifest);

    await expect(loadRemote('TestModule/TestComponent')).rejects.toThrow(
      /Failed to load component/i,
    );
  });
});
