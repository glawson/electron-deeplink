#include <napi.h>

#import <CoreFoundation/CoreFoundation.h>
#import <Foundation/Foundation.h>

void SetRuntimeAppProtocol(const Napi::CallbackInfo &info) {
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


  NSString *bundleID = [NSString stringWithFormat:@"com.deeplink.%@", appProtocol];
  OSStatus setDefaultStatus = LSSetDefaultHandlerForURLScheme(
      (__bridge CFStringRef)appProtocol, (__bridge CFStringRef)bundleID);

  NSURL *url =
      [NSURL URLWithString:[NSString stringWithFormat:@"%@://", appProtocol]];
  CFArrayRef urlList =
      LSCopyApplicationURLsForURL((__bridge CFURLRef)url, kLSRolesAll);

  if (debug) {
    NSLog(@"appProtocol: %@", appProtocol);
    NSLog(@"appPath: %@", appPath);
    NSLog(@"inUrl: %@", inUrl);
    NSLog(@"registerStatus: %d", registerStatus);
    NSLog(@"setDefaultStatus: %d", setDefaultStatus);
    NSLog(@"bundleID: %@", bundleID);
    NSLog(@"url: %@", url);
    NSLog(@"urlList: %@", urlList);
  }
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "SetRuntimeAppProtocol"),
              Napi::Function::New(env, SetRuntimeAppProtocol));
  return exports;
}

NODE_API_MODULE(handler, Init)
