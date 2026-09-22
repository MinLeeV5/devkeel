/*HDBG:__HDBG_SESSION__:B*/
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

final class Hdbg {
    private static final String ENDPOINT = setting(
        "hdbg.endpoint", "HDBG_ENDPOINT", "__HDBG_ENDPOINT__");
    private static final String SESSION = setting(
        "hdbg.session", "HDBG_SESSION", "__HDBG_SESSION__");
    private static final String RUNTIME = setting(
        "hdbg.runtime", "HDBG_RUNTIME", "java");
    private static final ThreadPoolExecutor EXECUTOR = new ThreadPoolExecutor(
        1,
        1,
        0L,
        TimeUnit.MILLISECONDS,
        new ArrayBlockingQueue<Runnable>(256),
        new ThreadFactory() {
            public Thread newThread(Runnable task) {
                Thread thread = new Thread(task, "hdbg-emitter");
                thread.setDaemon(true);
                return thread;
            }
        },
        new ThreadPoolExecutor.DiscardPolicy());

    private Hdbg() {
    }

    static void log(final String event, final Object data) {
        try {
            EXECUTOR.execute(new Runnable() {
                public void run() {
                    send(event, data);
                }
            });
        } catch (RuntimeException ignored) {
        }
    }

    static void flush(long timeoutMillis) {
        EXECUTOR.shutdown();
        try {
            EXECUTOR.awaitTermination(timeoutMillis, TimeUnit.MILLISECONDS);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }

    private static void send(String event, Object data) {
        HttpURLConnection connection = null;
        try {
            String url = ENDPOINT.replaceAll("/+$", "") + "/log"
                + "?s=" + encode(SESSION)
                + "&r=" + encode(RUNTIME)
                + "&e=" + encode(String.valueOf(event));
            byte[] body = String.valueOf(data).getBytes(StandardCharsets.UTF_8);
            connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(250);
            connection.setReadTimeout(250);
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "text/plain; charset=utf-8");
            connection.setFixedLengthStreamingMode(body.length);
            OutputStream output = connection.getOutputStream();
            try {
                output.write(body);
            } finally {
                output.close();
            }
            int status = connection.getResponseCode();
            InputStream input = status >= 400
                ? connection.getErrorStream()
                : connection.getInputStream();
            if (input != null) input.close();
        } catch (Exception ignored) {
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private static String encode(String value) throws Exception {
        return URLEncoder.encode(value, "UTF-8");
    }

    private static String setting(String property, String environment, String fallback) {
        String value = System.getProperty(property);
        if (value == null || value.isEmpty()) value = System.getenv(environment);
        return value == null || value.isEmpty() ? fallback : value;
    }
}
/*HDBG:__HDBG_SESSION__:E*/
