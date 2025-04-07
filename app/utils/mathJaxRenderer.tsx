import React from 'react';
import { View, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface MathJaxRendererProps {
  formula: string;
}

const MathJaxRenderer: React.FC<MathJaxRendererProps> = ({ formula }) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <script type="text/javascript" async 
          src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML">
        </script>
        <style>
          body { margin: 0; padding: 0; }
          #math { font-size: 24px; text-align: center; margin: 10px; }
        </style>
      </head>
      <body>
        <div id="math">$$${formula}$$</div>
        <script type="text/javascript">
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "math"]);
        </script>
      </body>
    </html>
  `;

  return (
    <View style={{ height: 100, marginVertical: 10 }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
};

export default MathJaxRenderer;