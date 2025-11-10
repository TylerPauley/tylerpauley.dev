export interface BlogPost {
	title: string;
	excerpt: string;
	date: string;
	slug: string;
	tags: string[];
	readTime: string;
	pinned?: boolean;
	author?: string;
}

export const posts: BlogPost[] = [
{
		title: "Building Tools to Understand the Why's and How's",
		excerpt: "Exploring how creating your own tools helps deepen understanding of underlying concepts. From building security toolkits to gamified learning experiences, discover how hands-on development teaches you more than just following tutorials.",
		date: "2025-08-12",
		slug: "building-tools-understand-whys-hows",
		tags: ["Learning", "Development", "Education", "Tools"],
		readTime: "8 min read",
		pinned: false,
		author: "Tyler Pauley"
	},
	{
		title: "Streamlining Blog Management: From Manual Edits to Automation",
		excerpt: "As web developers and content creators, we often find ourselves repeating mundane tasks. While the initial setup of a website might be exciting, the ongoing maintenance, especially for dynamic content like a blog, can quickly become a time sink. Today, I'm delving into a fascinating journey of how I tackled this challenge head-on, transforming my manual, error-prone blog management system into an elegant, automated solution.",
		date: "2025-11-09",
		slug: "streamlining-blog-management-from-manual-edits-to-automation",
		tags: ["Automation", "Web Development", "JavaScript", "Node.js", "Astro", "Blogging", "Developer tools"],
		readTime: "4 min read",
		pinned: false,
		author: "Tyler Pauley"
	}
];

