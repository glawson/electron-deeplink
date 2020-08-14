#include <napi.h>

#import <CoreFoundation/CoreFoundation.h>
#import <Foundation/Foundation.h>

Napi::Object SetRuntimeAppProtocol(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  const std::string path = info[0].As<Napi::String>().Utf8Value();
  const std::string protocol = info[1].As<Napi::String>().Utf8Value();
  const Boolean debug = info[2].As<Napi::Boolean>();

  NSString *appProtocol =
      [NSString stringWithCString:protocol.c_str()
                         encoding:[NSString defaultCStringEncoding]];
  NSString *appPath =
      [NSString stringWithCString:path.c_str()
                         encoding:[NSString defaultCStringEncoding]];
  NSURL *inUrl = [NSURL fileURLWithPath:appPath];

  OSStatus registerStatus =
      LSRegisterURL((__bridge CFURLRef _Nonnull)(inUrl), true);

  NSString *bundleID =
      [NSString stringWithFormat:@"com.deeplink.%@", appProtocol];
  OSStatus setDefaultStatus = LSSetDefaultHandlerForURLScheme(
      (__bridge CFStringRef)appProtocol, (__bridge CFStringRef)bundleID);

  NSURL *url =
      [NSURL URLWithString:[NSString stringWithFormat:@"%@://", appProtocol]];
  CFArrayRef urlList =
      LSCopyApplicationURLsForURL((__bridge CFURLRef)url, kLSRolesAll);

  Napi::Object results = Napi::Object::New(env);

  if (debug) {
    NSString *registerStatusMsg = [((NSString *)SecCopyErrorMessageString(
        registerStatus, NULL)) autorelease];
    NSString *setDefaultStatusMsg = [((NSString *)SecCopyErrorMessageString(
        setDefaultStatus, NULL)) autorelease];

    if (urlList == NULL) {
      Napi::Array appUrls = Napi::Array::New(env);
      results.Set("urlList", appUrls);
    } else {
      Napi::Array appUrls = Napi::Array::New(env, CFArrayGetCount(urlList));

      for (int i = 0; i < CFArrayGetCount(urlList); i++) {
        NSString *urlItem = [NSString
            stringWithFormat:@"%@", CFArrayGetValueAtIndex(urlList, i)];

        appUrls[i] = [urlItem UTF8String];
      }
      results.Set("urlList", appUrls);
    }

    results.Set("appProtocol", [appProtocol UTF8String]);
    results.Set("appPath", [appPath UTF8String]);
    results.Set("inUrl", [inUrl.absoluteString UTF8String]);
    results.Set("registerStatus", [registerStatusMsg UTF8String]);
    results.Set("setDefaultStatus", [setDefaultStatusMsg UTF8String]);
    results.Set("bundleID", [bundleID UTF8String]);
    results.Set("url", [url.absoluteString UTF8String]);
  }

  return results;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "SetRuntimeAppProtocol"),
              Napi::Function::New(env, SetRuntimeAppProtocol));
  return exports;
}

NODE_API_MODULE(handler, Init)
