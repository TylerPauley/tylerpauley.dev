export interface BlogPost {
	title: string;
	excerpt: string;
	date: string;
	slug: string;
	tags: string[];
	readTime: string;
}

export const posts: BlogPost[] = [
	{
		title: "Building Tools to Understand the Why's and How's",
		excerpt: "Exploring how creating your own tools helps deepen understanding of underlying concepts. From building security toolkits to gamified learning experiences, discover how hands-on development teaches you more than just following tutorials.",
		date: "2025-08-12",
		slug: "building-tools-understand-whys-hows",
		tags: ["Learning", "Development", "Education", "Tools"],
		readTime: "8 min read"
	},
	{
		title: "Streamlining Blog Management: From Manual Edits to Automation",
		excerpt: "Discover how a custom-built suite of tools transformed the tedious manual process of adding and removing blog posts into a seamless, automated workflow.",
		date: "2025-11-09",
		slug: "streamlining-blog-management-from-manual-edits-to-automation",
		tags: ["Automation", "Web Development", "JavaScript", "Node.js", "Astro", "Blogging", "Developer tools"],
		readTime: "4 min read"
	}
];

