package com.campjavery.photobooth.smsshare;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.provider.Telephony;
import android.util.Base64;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;

// Opens the device's default Messages app with an image attached and the
// recipient pre-filled, via a standard ACTION_SEND intent — this is the only
// way a regular (non-default-SMS-handler) app can hand off an MMS-style
// message on Android; sending one silently in the background requires the
// app to BE the default SMS app, which is a much bigger, more invasive
// change than a photo booth warrants.
@CapacitorPlugin(name = "SmsShare")
public class SmsSharePlugin extends Plugin {

    @PluginMethod
    public void shareImage(PluginCall call) {
        String phoneNumber = call.getString("phoneNumber");
        String base64Image = call.getString("base64Image");

        if (phoneNumber == null || phoneNumber.isEmpty()) {
            call.reject("phoneNumber is required");
            return;
        }
        if (base64Image == null || base64Image.isEmpty()) {
            call.reject("base64Image is required");
            return;
        }

        try {
            Context context = getContext();

            byte[] imageBytes = Base64.decode(base64Image, Base64.DEFAULT);
            File cacheDir = new File(context.getCacheDir(), "shared-strips");
            if (!cacheDir.exists()) {
                cacheDir.mkdirs();
            }
            File imageFile = new File(cacheDir, "strip-" + System.currentTimeMillis() + ".jpg");
            try (FileOutputStream out = new FileOutputStream(imageFile)) {
                out.write(imageBytes);
            }

            String authority = context.getPackageName() + ".fileprovider";
            Uri imageUri = FileProvider.getUriForFile(context, authority, imageFile);

            String defaultSmsPackage = Telephony.Sms.getDefaultSmsPackage(context);

            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType("image/jpeg");
            intent.putExtra(Intent.EXTRA_STREAM, imageUri);
            // "address" isn't a formal Android SDK constant, but it's the
            // long-standing convention Messages apps (Google Messages,
            // Samsung Messages) read to pre-fill the recipient field.
            intent.putExtra("address", phoneNumber);
            intent.putExtra("sms_body", "Your Camp Javery photo booth strip! #CampJavery");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            // Deliberately no FLAG_ACTIVITY_NEW_TASK: this call runs from the
            // app's own Activity context (Capacitor plugins get the Activity,
            // not Application, context), so Messages opens on top of our task
            // and the back button returns straight to the booth app — adding
            // NEW_TASK would instead send Messages to a separate task, making
            // "back" go to the home screen rather than back to the booth.
            if (defaultSmsPackage != null) {
                intent.setPackage(defaultSmsPackage);
            }

            context.startActivity(intent);

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Could not open Messages: " + e.getMessage(), e);
        }
    }
}
