// Render the actual templates with Go's HTML escaping, like Supabase's templates.
// Uses only the Go standard library and fake credentials; never sends email.
package main

import (
 "bytes"
 "encoding/json"
 "fmt"
 htmltemplate "html/template"
 "os"
 "path/filepath"
 "strings"
 texttemplate "text/template"
)
func main() {
 out := "/tmp/gsc-email-previews"
 if len(os.Args) > 1 { out = os.Args[1] }
 if err := run(out); err != nil { fmt.Fprintln(os.Stderr, err); os.Exit(1) }
}
func run(out string) error {
 raw, err := os.ReadFile("supabase/templates/subjects.json"); if err != nil { return err }
 var subjects map[string]string; if err = json.Unmarshal(raw, &subjects); err != nil { return err }
 if err = os.MkdirAll(out, 0755); err != nil { return err }
 scenarios := map[string]string{"personalized":"Anastasia", "fallback":"", "no-metadata":"", "escaped":"<img src=x onerror=alert(1)>"}
 index := "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>GSC email previews</title><body style=\"font:16px Arial;max-width:900px;margin:32px auto;padding:16px\"><h1>GSC authentication emails</h1><p>Local rendering previews only. All codes and tokens are fake. No email has been sent.</p><ul>"
 for file, subject := range subjects {
  source, err := os.ReadFile(filepath.Join("supabase/templates",file+".html")); if err != nil { return err }
  h, err := htmltemplate.New(file).Option("missingkey=zero").Parse(string(source)); if err != nil { return err }
  plain, err := os.ReadFile(filepath.Join("supabase/templates",file+".txt")); if err != nil { return err }
  t, err := texttemplate.New(file).Option("missingkey=zero").Parse(string(plain)); if err != nil { return err }
  for scenario, name := range scenarios {
   metadata := map[string]interface{}{}; if name != "" { metadata["first_name"] = name }
   data := map[string]interface{}{"SiteURL":"https://galstyansspeakingclub.ru", "TokenHash":strings.Repeat("a",64), "Token":"123456", "Data":metadata, "NewEmail":"updated@example.invalid"}
   if scenario == "no-metadata" { data["Data"] = nil }
   var html, text bytes.Buffer
   if err = h.Execute(&html,data); err != nil { return err }; if err = t.Execute(&text,data); err != nil { return err }
   rendered := html.String()
   if strings.Contains(rendered,"#ZgotmplZ") || strings.Contains(rendered,"<no value>") || strings.Contains(rendered,"{{") { return fmt.Errorf("unsupported or unresolved template value in %s",file) }
   if (scenario == "fallback" || scenario == "no-metadata") && !strings.Contains(rendered,"Hi there,") { return fmt.Errorf("missing fallback in %s",file) }
   if scenario == "personalized" && !strings.Contains(rendered,"Hi Anastasia,") { return fmt.Errorf("missing name in %s",file) }
   if scenario == "escaped" && (strings.Contains(rendered,"<img src=x") || !strings.Contains(rendered,"&lt;img")) { return fmt.Errorf("unescaped name in %s",file) }
   base := file+"-"+scenario
   if err = os.WriteFile(filepath.Join(out,base+".html"),html.Bytes(),0644); err != nil { return err }
   if err = os.WriteFile(filepath.Join(out,base+".txt"),text.Bytes(),0644); err != nil { return err }
   if scenario != "escaped" { index += "<li><a href=\""+base+".html\">"+htmltemplate.HTMLEscapeString(subject)+" — "+scenario+"</a> · <a href=\""+base+".txt\">Plain text</a></li>" }
  }
 }
 if err = os.WriteFile(filepath.Join(out,"index.html"),[]byte(index+"</ul></body></html>"),0644); err != nil { return err }
 fmt.Printf("Rendered and validated %d email types × 4 name scenarios (HTML and text). No email sent. Previews: %s\n",len(subjects),out)
 return nil
}
