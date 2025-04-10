import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, FileText, Download, Trash2, Clock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";

// Sample Translation type (should match your server model)
interface Translation {
  id: number;
  userId: number;
  fileName: string;
  fileType: "epub" | "pdf";
  sourceLanguage: string;
  targetLanguage: string;
  status: "pending" | "extracting" | "translating" | "reconstructing" | "completed" | "failed";
  progress: number;
  totalPages?: number;
  completedPages?: number;
  translatedFileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Project Collection interface (for grouping translations)
interface Project {
  id: string; // Will use name as ID for now
  name: string;
  description: string;
  translations: Translation[];
  createdAt: string;
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });
  const [selectedTranslations, setSelectedTranslations] = useState<number[]>([]);
  
  // Fetch translations
  const { data: translations, isLoading } = useQuery<Translation[]>({
    queryKey: ["/api/translations"],
    enabled: !!user,
  });

  // Sample projects - in a real app, these would come from the API
  const sampleProjects: Project[] = [
    {
      id: "classic-literature",
      name: "Classic Literature",
      description: "Translations of classic literature books",
      translations: translations?.filter(t => 
        ["Pride and Prejudice", "Moby Dick", "Don Quixote"].some(name => 
          t.fileName.toLowerCase().includes(name.toLowerCase())
        )) || [],
      createdAt: "2025-01-15T12:00:00Z",
    },
    {
      id: "science-fiction",
      name: "Science Fiction",
      description: "Modern sci-fi novels and short stories",
      translations: translations?.filter(t => 
        ["Foundation", "Dune", "Asimov"].some(name => 
          t.fileName.toLowerCase().includes(name.toLowerCase())
        )) || [],
      createdAt: "2025-02-20T14:30:00Z",
    }
  ];

  // Filtered translations based on search query
  const filteredProjects = sampleProjects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled via the filteredProjects above
  };

  // Create a new project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProject(true);
    
    // In a real app, we would send this to the API
    setTimeout(() => {
      setIsCreatingProject(false);
      toast({
        title: "Project created",
        description: `${newProject.name} has been created successfully`,
      });
      setNewProject({ name: "", description: "" });
    }, 1000);
  };

  // Function to get status badge color
  const getStatusBadge = (status: Translation["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "extracting":
        return <Badge variant="secondary" className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Extracting</Badge>;
      case "translating":
        return <Badge variant="secondary" className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Translating</Badge>;
      case "reconstructing":
        return <Badge variant="secondary" className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Reconstructing</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-500 text-white hover:bg-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>;
      case "failed":
        return <Badge variant="destructive" className="flex items-center gap-1"><Trash2 className="h-3 w-3" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Toggle translation selection for adding to a project
  const toggleTranslation = (id: number) => {
    if (selectedTranslations.includes(id)) {
      setSelectedTranslations(selectedTranslations.filter(t => t !== id));
    } else {
      setSelectedTranslations([...selectedTranslations, id]);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Projects</h1>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Create a new project to organize your translations
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateProject} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="e.g., Spanish Literature"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Brief description of what this project contains"
                  />
                </div>
                
                {translations && translations.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="translations">Add Translations</Label>
                    <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-2">
                      {translations.map((translation) => (
                        <div key={translation.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`translation-${translation.id}`}
                            checked={selectedTranslations.includes(translation.id)}
                            onChange={() => toggleTranslation(translation.id)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor={`translation-${translation.id}`} className="text-sm">
                            {translation.fileName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <DialogFooter>
                  <Button type="submit" disabled={isCreatingProject}>
                    {isCreatingProject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Project
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex w-full max-w-lg gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>
        
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="recent">Recent Translations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-medium">No projects found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "Create your first project to organize your translations"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredProjects.map((project) => (
                  <Card key={project.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{project.name}</CardTitle>
                          <CardDescription>{project.description}</CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="text-sm font-medium mb-3">Translations ({project.translations.length})</h3>
                      
                      {project.translations.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No translations in this project yet</p>
                      ) : (
                        <div className="space-y-4">
                          {project.translations.map((translation) => (
                            <div key={translation.id} className="border rounded-md p-4">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                                <div>
                                  <h4 className="font-medium">{translation.fileName}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {translation.sourceLanguage} to {translation.targetLanguage}
                                  </p>
                                </div>
                                <div className="flex items-center mt-2 md:mt-0">
                                  {getStatusBadge(translation.status)}
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {format(new Date(translation.createdAt), "MMM d, yyyy")}
                                  </span>
                                </div>
                              </div>
                              
                              {translation.status !== "completed" && translation.status !== "failed" && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Progress</span>
                                    <span>{translation.progress}%</span>
                                  </div>
                                  <Progress value={translation.progress} className="h-2" />
                                </div>
                              )}
                              
                              <div className="flex justify-end mt-3 space-x-2">
                                {translation.status === "completed" && (
                                  <Button size="sm" variant="outline" className="flex items-center">
                                    <Download className="mr-1 h-3.5 w-3.5" />
                                    Download
                                  </Button>
                                )}
                                <Link href={`/translations/${translation.id}`}>
                                  <Button size="sm" variant="ghost">View Details</Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between text-sm text-muted-foreground border-t pt-4">
                      <span>Created: {format(new Date(project.createdAt), "MMM d, yyyy")}</span>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        Add Translations
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recent">
            {!translations || translations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-medium">No translations yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload your first document for translation
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/dashboard">
                    Start Translating
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {translations.map((translation) => (
                  <Card key={translation.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center">
                            {translation.fileName}
                            <Badge className="ml-2" variant="outline">{translation.fileType.toUpperCase()}</Badge>
                          </CardTitle>
                          <CardDescription>
                            {translation.sourceLanguage} to {translation.targetLanguage}
                          </CardDescription>
                        </div>
                        <div>
                          {getStatusBadge(translation.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {translation.status !== "completed" && translation.status !== "failed" && (
                        <div className="mt-2 mb-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>
                              {translation.progress}%
                              {translation.completedPages && translation.totalPages && (
                                <> ({translation.completedPages}/{translation.totalPages} pages)</>
                              )}
                            </span>
                          </div>
                          <Progress value={translation.progress} className="h-2" />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Created: {format(new Date(translation.createdAt), "MMM d, yyyy")}</span>
                        
                        <div className="flex space-x-2">
                          <Select>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Add to project" />
                            </SelectTrigger>
                            <SelectContent>
                              {sampleProjects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                              <SelectItem value="new">+ Create New Project</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 pt-0">
                      {translation.status === "completed" && (
                        <Button size="sm" variant="outline" className="flex items-center">
                          <Download className="mr-1 h-3.5 w-3.5" />
                          Download
                        </Button>
                      )}
                      <Link href={`/translations/${translation.id}`}>
                        <Button size="sm">View Details</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}