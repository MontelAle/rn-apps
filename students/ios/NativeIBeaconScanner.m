#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(NativeIBeaconScanner, RCTEventEmitter)

RCT_EXTERN_METHOD(start:(NSString *)uuidString)

RCT_EXTERN_METHOD(stop:(NSString *)uuidString)

RCT_EXTERN_METHOD(stopAll)

@end