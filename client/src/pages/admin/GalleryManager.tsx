import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { SERVICES } from "@shared/data";
import { Upload, Trash2, Loader2, X, Image as ImageIcon } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useNoindex } from "@/hooks/useNoindex";

export default function GalleryManager() {
  useNoindex();
  const { data: images, isLoading, refetch } = trpc.admin.gallery.list.useQuery();
  const uploadMutation = trpc.admin.gallery.upload.useMutation({
    onSuccess: () => { toast.success("Image uploaded!"); refetch(); setShowUpload(false); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.gallery.delete.useMutation({
    onSuccess: () => { toast.success("Image deleted"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [imageType, setImageType] = useState<"before" | "after" | "general">("general");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{ base64: string; name: string; type: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle(""); setDescription(""); setServiceType(""); setImageType("general");
    setPreview(null); setFileData(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      setFileData({ base64: result.split(",")[1], name: file.name, type: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!fileData) { toast.error("Please select an image"); return; }
    uploadMutation.mutate({
      fileBase64: fileData.base64,
      fileName: fileData.name,
      contentType: fileData.type,
      title: title || undefined,
      description: description || undefined,
      serviceType: serviceType || undefined,
      imageType,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Gallery Manager</h1>
            <p className="text-muted-foreground">Upload and manage before/after photos for your gallery.</p>
          </div>
          <Button onClick={() => setShowUpload(!showUpload)} className="bg-primary text-white">
            <Upload className="w-4 h-4 mr-2" /> Upload Image
          </Button>
        </div>

        {/* Upload Form */}
        {showUpload && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg">Upload New Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                {preview ? (
                  <div className="relative inline-block">
                    <img src={preview} alt="Preview" className="max-h-48 rounded-lg mx-auto" />
                    <button onClick={(e) => { e.stopPropagation(); setPreview(null); setFileData(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to select an image (max 10MB)</p>
                  </>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. House Wash - Before" />
                </div>
                <div>
                  <Label>Service Type</Label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                    <SelectContent>
                      {SERVICES.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.shortName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Image Type</Label>
                  <Select value={imageType} onValueChange={v => setImageType(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before</SelectItem>
                      <SelectItem value="after">After</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleUpload} disabled={uploadMutation.isPending || !fileData} className="bg-primary text-white">
                  {uploadMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploadMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
                <Button variant="outline" onClick={() => { setShowUpload(false); resetForm(); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(images || []).map((img: any) => (
              <Card key={img.id} className="overflow-hidden group">
                <div className="relative aspect-square">
                  <img src={img.imageUrl} alt={img.title || "Gallery"} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this image?")) {
                          deleteMutation.mutate({ id: img.id });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                  {img.imageType && img.imageType !== "general" && (
                    <Badge className="absolute top-2 left-2 bg-black/70 text-white text-xs">
                      {img.imageType}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{img.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground">{img.serviceType?.replace(/_/g, " ") || "General"}</p>
                </CardContent>
              </Card>
            ))}
            {(!images || images.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No gallery images yet. Upload your first image above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
