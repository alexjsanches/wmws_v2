package expo.core;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Collections;
import java.util.List;

/**
 * Compat shim para autolinking legado que ainda referencia expo.core.ExpoModulesPackage.
 * Em SDKs novos, delega para expo.modules.ExpoModulesPackage via reflexão.
 */
public class ExpoModulesPackage implements ReactPackage {
  private final ReactPackage delegate;

  public ExpoModulesPackage() {
    this.delegate = resolveDelegate();
  }

  private ReactPackage resolveDelegate() {
    try {
      Class<?> clazz = Class.forName("expo.modules.ExpoModulesPackage");
      Object instance = clazz.getDeclaredConstructor().newInstance();
      if (instance instanceof ReactPackage) {
        return (ReactPackage) instance;
      }
    } catch (Throwable ignored) {
      // Fallback vazio; evita quebrar compilação em autolinking legado.
    }
    return null;
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    if (delegate != null) {
      return delegate.createNativeModules(reactContext);
    }
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    if (delegate != null) {
      return delegate.createViewManagers(reactContext);
    }
    return Collections.emptyList();
  }
}
