# WordPress Exported Redirection Code

## Exporting from WordPress

1. Go to Tools | Redirection.
2. Select Import/Export from the horizontal menu.
3. Under Export, choose Everything | Complete data (JSON) and click Download.
4. Move the exported file to the `data` folder of this repository.
5. Empty the `output` folder.
6. Execute the `npm run process-wp` to generate the output.

### Checks Before Posting

1. Search in code for `(.*?)` (regex in general); move any of these to the correct `issues` file.

## Exporting Cloudflare Bulk Redirects


