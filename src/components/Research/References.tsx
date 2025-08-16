import type { GroundingChunk } from '@google/genai';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LinkIcon from '@mui/icons-material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTaskStore } from '../../stores/task';
import type { ResearchTask } from '../../types';

function ResearchReferences() {
  const { sources, sourceQueue, researchTasks } = useTaskStore();
  const [copyButtonText, setCopyButtonText] = useState('Copy List');

  const references = sources.length
    ? buildReferencesListFromSources(sources)
    : buildReferencesListFromResearchTasks(researchTasks);

  if (!references.length) {
    return null;
  }

  const totalSites = references.length;
  const totalLinks = references.reduce((acc, ref) => acc + ref.urls.length, 0);

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyReferences = async () => {
    const referenceText = references
      .map(reference => {
        const urlList = reference.urls.map(url => `  - ${url}`).join('\n');
        return `${reference.domain}:\n${urlList}`;
      })
      .join('\n\n');

    const fullText = `References & Sources\n${'='.repeat(20)}\n\n${referenceText}`;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy List'), 2000);
    } catch (err) {
      console.error('Failed to copy references:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fullText;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopyButtonText('Copied!');
        setTimeout(() => setCopyButtonText('Copy List'), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const getFaviconUrl = (domain: string) => {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  };

  const getDisplayUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const path =
        urlObj.pathname.length > 50 ? urlObj.pathname.substring(0, 47) + '...' : urlObj.pathname;
      return urlObj.hostname + path;
    } catch {
      return url.length > 60 ? url.substring(0, 57) + '...' : url;
    }
  };

  return (
    <Card
      id="research-references"
      elevation={2}
      className="mb-6 border-l-4 border-l-blue-300 bg-blue-50/50 transition-all duration-300"
    >
      <CardContent className="pb-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
              <BookmarkIcon sx={{ fontSize: 18 }} />
            </div>
            <Typography variant="h6" className="font-semibold text-gray-800">
              References & Sources
            </Typography>
          </div>
          <div className="flex items-center gap-2">
            {sourceQueue.length > 0 ? (
              <AutorenewIcon className="animate-spin text-gray-400" />
            ) : (
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyReferences}
                variant="outlined"
                className="text-xs"
              >
                {copyButtonText}
              </Button>
            )}

            <Chip label={`${totalSites} sites`} size="small" color="primary" variant="outlined" />
            <Chip label={`${totalLinks} links`} size="small" color="primary" variant="outlined" />
          </div>
        </div>

        <Typography variant="body2" className="mb-4 text-gray-600">
          All sources and references used in this research report.
        </Typography>

        <Divider className="mb-4" />

        <Accordion
          defaultExpanded={totalSites <= 3}
          slotProps={{ transition: { unmountOnExit: true } }}
          className="border-0 bg-transparent shadow-none"
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} className="px-0 py-2">
            <div className="flex items-center gap-2">
              <LinkIcon className="text-blue-600" sx={{ fontSize: 20 }} />
              <Typography className="font-medium text-gray-800">
                View All Sources ({totalSites} domains)
              </Typography>
            </div>
          </AccordionSummary>

          <AccordionDetails className="px-0 py-2">
            <List className="py-0">
              {references.map((reference, index) => (
                <Box key={reference.domain}>
                  <ListItem className="px-0 py-2">
                    <ListItemAvatar>
                      <Avatar src={getFaviconUrl(reference.domain)} className="h-8 w-8">
                        <LinkIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography className="font-medium text-gray-800">
                          {reference.domain}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" className="text-gray-600">
                          {reference.urls.length} link{reference.urls.length !== 1 ? 's' : ''}
                        </Typography>
                      }
                    />
                  </ListItem>

                  {/* URL List for this domain */}
                  <List className="ml-12 py-0">
                    {reference.urls.map(url => (
                      <ListItemButton
                        key={url}
                        className="rounded px-3 py-1 hover:bg-blue-100"
                        onClick={() => handleLinkClick(url)}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              className="text-gray-700 hover:text-blue-600"
                            >
                              {getDisplayUrl(url)}
                            </Typography>
                          }
                        />
                        <Tooltip title="Open in new tab">
                          <IconButton size="small" className="text-gray-500">
                            <OpenInNewIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </ListItemButton>
                    ))}
                  </List>

                  {index < references.length - 1 && <Divider className="my-2" />}
                </Box>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}

interface Reference {
  domain: string;
  urls: string[];
}

function buildReferencesListFromSources(sources: string[]) {
  const references: Reference[] = [];

  // get domain from sources
  const domains = getDomainsFromSources(sources);

  // foreach domain, create a reference
  domains.forEach(domain => {
    references.push({
      domain,
      urls: sources.filter(source => getDomainFromUrl(source) === domain),
    });
  });

  return references;
}

function buildReferencesListFromResearchTasks(tasks: ResearchTask[]) {
  const references: Reference[] = [];

  // collect all groundingChunks from all tasks
  const allGroundingChunks: GroundingChunk[] = [];

  tasks.forEach((task: ResearchTask) => {
    if (task.groundingChunks && Array.isArray(task.groundingChunks)) {
      allGroundingChunks.push(...task.groundingChunks);
    }
  });

  // get titles from all groundingChunks
  const titles = getTitlesFromGroundingChunks(allGroundingChunks);

  // foreach title, create a reference
  titles.forEach(title => {
    if (title) {
      references.push({
        domain: title,
        urls: allGroundingChunks
          .filter(chunk => chunk.web?.title === title && chunk.web?.uri)
          .map(chunk => chunk.web?.uri || ''),
      });
    }
  });

  return references;
}

function getTitlesFromGroundingChunks(chunks: GroundingChunk[]) {
  const titles = chunks.filter(chunk => chunk.web?.title).map(chunk => chunk.web?.title);

  return Array.from(new Set(titles));
}

function getDomainsFromSources(sources: string[]) {
  const domains = sources.map(source => {
    return getDomainFromUrl(source);
  });

  return Array.from(new Set(domains));
}

function getDomainFromUrl(url: string) {
  const hostname = new URL(url).hostname;
  return hostname;
}

export default ResearchReferences;
