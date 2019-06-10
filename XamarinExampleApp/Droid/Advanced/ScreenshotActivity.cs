using Android.App;
using Android.Graphics;
using Android.OS;
using Android.Webkit;
using Com.Wikitude.Architect;
using Java.Lang;
using Org.Json;
using System.IO;
using Android.Content;
using Com.Wikitude.Common.Permission;
using Android.Widget;
using Android;
using RestSharp;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using Xamarin.Essentials;

namespace XamarinExampleApp.Droid.Advanced
{
    public class FaceRectangle
    {
        public int top { get; set; }
        public int left { get; set; }
        public int width { get; set; }
        public int height { get; set; }
    }

    public class HeadPose
    {
        public double pitch { get; set; }
        public double roll { get; set; }
        public double yaw { get; set; }
    }

    public class FacialHair
    {
        public double moustache { get; set; }
        public double beard { get; set; }
        public double sideburns { get; set; }
    }

    public class Emotion
    {
        public double anger { get; set; }
        public double contempt { get; set; }
        public double disgust { get; set; }
        public double fear { get; set; }
        public double happiness { get; set; }
        public double neutral { get; set; }
        public double sadness { get; set; }
        public double surprise { get; set; }
    }

    public class Blur
    {
        public string blurLevel { get; set; }
        public double value { get; set; }
    }

    public class Exposure
    {
        public string exposureLevel { get; set; }
        public double value { get; set; }
    }

    public class Noise
    {
        public string noiseLevel { get; set; }
        public double value { get; set; }
    }

    public class Makeup
    {
        public bool eyeMakeup { get; set; }
        public bool lipMakeup { get; set; }
    }

    public class Occlusion
    {
        public bool foreheadOccluded { get; set; }
        public bool eyeOccluded { get; set; }
        public bool mouthOccluded { get; set; }
    }

    public class HairColor
    {
        public string color { get; set; }
        public double confidence { get; set; }
    }

    public class Hair
    {
        public double bald { get; set; }
        public bool invisible { get; set; }
        public List<HairColor> hairColor { get; set; }
    }

    public class FaceAttributes
    {
        public double smile { get; set; }
        public HeadPose headPose { get; set; }
        public string gender { get; set; }
        public double age { get; set; }
        public FacialHair facialHair { get; set; }
        public string glasses { get; set; }
        public Emotion emotion { get; set; }
        public Blur blur { get; set; }
        public Exposure exposure { get; set; }
        public Noise noise { get; set; }
        public Makeup makeup { get; set; }
        public List<object> accessories { get; set; }
        public Occlusion occlusion { get; set; }
        public Hair hair { get; set; }
    }

    public class RootObject
    {
        public string faceId { get; set; }
        public FaceRectangle faceRectangle { get; set; }
        public FaceAttributes faceAttributes { get; set; }
    }

    [Activity(Label = "ScreenshotActivity", ConfigurationChanges = Android.Content.PM.ConfigChanges.Orientation | Android.Content.PM.ConfigChanges.KeyboardHidden | Android.Content.PM.ConfigChanges.ScreenSize)]
    public class ScreenshotActivity : SimpleArActivity, IArchitectJavaScriptInterfaceListener, ArchitectView.ICaptureScreenCallback, IPermissionManagerPermissionManagerCallback
    {
        private Bitmap screenCapture;
        public string usecase="";

        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);

            /*
             * The ArchitectJavaScriptInterfaceListener has to be added to the Architect view after ArchitectView.OnCreate.
             * There may be more than one ArchitectJavaScriptInterfaceListener.
             */
            architectView.AddArchitectJavaScriptInterfaceListener(this);
        }

        protected override void OnDestroy()
        {
            // The ArchitectJavaScriptInterfaceListener has to be removed from the Architect view before ArchitectView.OnDestroy.
            architectView.RemoveArchitectJavaScriptInterfaceListener(this);
            base.OnDestroy();
        }

        public override void OnRequestPermissionsResult(int requestCode, string[] permissions, Android.Content.PM.Permission[] grantResults)
        {
            int[] results = new int[grantResults.Length];
            for (int i = 0; i < grantResults.Length; i++) 
            {
                results[i] = (int)grantResults[i];
            }
            ArchitectView.PermissionManager.OnRequestPermissionsResult(requestCode, permissions, results);
        }

        /*
         * ArchitectJavaScriptInterfaceListener.OnJSONObjectReceived is called whenever
         * AR.platform.sendJSONObject is called in the JavaScript code.
         */
        public void OnJSONObjectReceived(JSONObject jsonObject)
        {
            if (jsonObject.GetString("action") == "capture_screen")
            {
                /*
                 * ArchitectView.CaptureScreen has two different modes:
                 *  - CaptureModeCamAndWebview which will capture the camera and web-view on top of it.
                 *  - CaptureModeCam which will capture ONLY the camera and its content (AR.Drawables).
                 *
                 * OnScreenCaptured will be called once the ArchitectView has processed the screen capturing and will
                 * provide a Bitmap containing the screenshot.
                 */
                usecase = "capture_screen";
                architectView.CaptureScreen(ArchitectView.CaptureScreenCallback.CaptureModeCamAndWebview, this);
            }
            else if (jsonObject.GetString("action") == "share_screen")
            {
                /*
                 * ArchitectView.CaptureScreen has two different modes:
                 *  - CaptureModeCamAndWebview which will capture the camera and web-view on top of it.
                 *  - CaptureModeCam which will capture ONLY the camera and its content (AR.Drawables).
                 *
                 * OnScreenCaptured will be called once the ArchitectView has processed the screen capturing and will
                 * provide a Bitmap containing the screenshot.
                 */
                usecase = "share_screen";

                architectView.CaptureScreen(ArchitectView.CaptureScreenCallback.CaptureModeCamAndWebview, this);
            }
        }

        public void OnScreenCaptured(Bitmap screenCapture)
        {
            if (screenCapture == null)
            {
                Toast.MakeText(this, Resource.String.error_screen_capture, ToastLength.Short);
            }
            else if(usecase == "capture_screen")
            {
                this.screenCapture = screenCapture;
                byte[] bitmapData;
                using (var stream = new MemoryStream())
                {
                    this.screenCapture.Compress(Bitmap.CompressFormat.Png, 0, stream);
                    bitmapData = stream.ToArray();
                }
                
                try
                {
                    MakeAnalysisRequest(bitmapData);
                }
                catch(Exception e)
                {

                }

                // Call to API to get who the person is
                
//              ArchitectView.PermissionManager.CheckPermissions(this, new string[] { Manifest.Permission.WriteExternalStorage }, 123, this);
            }
            else if (usecase == "share_screen")
            {
                this.screenCapture = screenCapture;
                ArchitectView.PermissionManager.CheckPermissions(this, new string[] { Manifest.Permission.WriteExternalStorage }, 123, this);
                architectView.CallJavascript("World.resetCamButton()");
            }
        }
        // Gets the analysis of the specified image by using the Face REST API.
        public async void MakeAnalysisRequest(byte[] byteData)
        {
            HttpClient client = new HttpClient();
            
            // Request headers.
            client.DefaultRequestHeaders.Add(
                "Ocp-Apim-Subscription-Key", "227cfeff04bc44adb393c19fcbb5da23");

            string requestParameters = "returnFaceId=true";

            string uri = "https://centralindia.api.cognitive.microsoft.com/face/v1.0/detect" + "?" + requestParameters;

            HttpResponseMessage response;

            using (ByteArrayContent content = new ByteArrayContent(byteData))
            {
                content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
                response = await client.PostAsync(uri, content);
                try
                {
                    string contentString = await response.Content.ReadAsStringAsync();
                    if (contentString.ToLowerInvariant().Contains("faceid"))
                    {
                        List<RootObject> JSONC = JsonConvert.DeserializeObject<List<RootObject>>(contentString);
                        if (JSONC.Count > 0)
                        {
                            string FACEid = "";
                            for(int i = 0; i < JSONC.Count; i++)
                            {
                                FACEid += JSONC[i].faceId + ",";
                            }
                            FACEid = FACEid.Substring(0, FACEid.Length - 1);
                            FACEid = FACEid.Replace(",", "\",\"");

                            var client1 = new RestClient("https://centralindia.api.cognitive.microsoft.com/face/v1.0/identify");
                            var request = new RestRequest(Method.POST);
                            request.AddHeader("postman-token", "bab5b421-1b8d-8a55-a72d-7bb21392cf5a");
                            request.AddHeader("cache-control", "no-cache");
                            request.AddHeader("content-type", "application/json");
                            request.AddHeader("ocp-apim-subscription-key", "227cfeff04bc44adb393c19fcbb5da23");
                            request.AddParameter("application/json", "{\r\n    \"largePersonGroupId\": \"friends\",\r\n    \"faceIds\": [\r\n        \"" + FACEid + "\"\r\n    ],\r\n    \"maxNumOfCandidatesReturned\": 1,\r\n    \"confidenceThreshold\": 0.5\r\n}\r\n", ParameterType.RequestBody);
                            IRestResponse response1 = client1.Execute(request);
                            if (response1.Content.ToString().ToLowerInvariant().Contains("personid"))
                            {
                                int startIndex = response1.Content.ToString().ToLowerInvariant().IndexOf("personid");
                                string newString = response1.Content.ToString().Substring(startIndex + "personid".Length + 3);
                                string name = newString.Substring(0, newString.IndexOf('"'));
                                architectView.CallJavascript("World.sendDataFromXam(\"" + name + "\")");
                                switch (name)
                                {
                                    case "96878630-01a9-4a32-8702-ee3a22f5170b":
                                        await TextToSpeech.SpeakAsync("Kelly is responsible for designing the talent strategy and roadmap to enable Dell’s future workforce in this digital world");
                                        break;

                                }
                            }
                            else
                            {
                                architectView.CallJavascript("World.sendDataFromXam(\"unknown\")");
                            }
                        }
                    }
                }
                catch(Exception e)
                {

                }
                // Display the JSON response.
            }
        }

        public void PermissionsDenied(string[] deniedPermissions)
        {
            Toast.MakeText(this, GetString(Resource.String.permissions_denied) + string.Join(",", deniedPermissions), ToastLength.Short).Show();
        }

        public void PermissionsGranted(int requestCode)
        {
            ScreenCapture.SaveScreenCaptureToExternalStorage(this, screenCapture);
        }

        public void ShowPermissionRationale(int requestCode, string[] permissions)
        {
            var alertBuilder = new AlertDialog.Builder(this);
            alertBuilder.SetCancelable(true);
            alertBuilder.SetTitle(Resource.String.permission_rationale_title);
            alertBuilder.SetMessage(GetString(Resource.String.permission_rationale_text) + string.Join(",", permissions));

            alertBuilder.SetPositiveButton(Android.Resource.String.Yes, new System.EventHandler<DialogClickEventArgs>((sender, eventArgs) =>
            {
                ArchitectView.PermissionManager.PositiveRationaleResult(requestCode, permissions);
            }));

            var alert = alertBuilder.Create();
            alert.Show();
        }
    }
}
